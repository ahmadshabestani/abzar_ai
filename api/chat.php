<?php
// INDUSTRIA AI - PHP 8.4 backend
// Keep this file on your server. Never expose your API key to JavaScript.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed'], JSON_UNESCAPED_UNICODE); exit; }

$configPath = __DIR__ . '/../config/config.php';
if (!is_file($configPath)) { http_response_code(500); echo json_encode(['error'=>'Backend config is missing. Create config/config.php from config.example.php.'], JSON_UNESCAPED_UNICODE); exit; }
$config = require $configPath;
$apiKey = trim((string)($config['openai_api_key'] ?? ''));
$model = $config['openai_model'] ?? 'gpt-4o-mini';
if ($apiKey === '' || $apiKey === 'PUT_YOUR_KEY_HERE') { http_response_code(503); echo json_encode(['error'=>'OPENAI_API_KEY is not configured on the server.'], JSON_UNESCAPED_UNICODE); exit; }

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
$message = trim((string)($body['message'] ?? ''));
$history = is_array($body['history'] ?? null) ? $body['history'] : [];
if ($message === '') { http_response_code(400); echo json_encode(['error'=>'Message is required.'], JSON_UNESCAPED_UNICODE); exit; }

$messages = [
  ['role'=>'system','content'=>'تو دستیار هوشمند INDUSTRIA AI هستی. به زبان فارسی پاسخ بده، دقیق و کاربردی باش. در موضوعات صنعتی، ابزار، تجهیزات و خرید محصول، ابتدا نیاز کاربر را روشن کن و سپس پیشنهاد منطقی بده. اگر اطلاعات کافی نداری، حدس قطعی نزن.']
];
foreach (array_slice($history, -10) as $item) {
  $role = ($item['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
  $content = trim((string)($item['content'] ?? ''));
  if ($content !== '') $messages[] = ['role'=>$role, 'content'=>$content];
}
$messages[] = ['role'=>'user','content'=>$message];

$payload = json_encode(['model'=>$model,'messages'=>$messages,'temperature'=>0.5], JSON_UNESCAPED_UNICODE);
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json','Authorization: Bearer '.$apiKey],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_TIMEOUT => 45,
]);
$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) { http_response_code(502); echo json_encode(['error'=>'AI connection failed: '.$curlError], JSON_UNESCAPED_UNICODE); exit; }
$data = json_decode($response, true);
if ($http < 200 || $http >= 300) { http_response_code(502); echo json_encode(['error'=>$data['error']['message'] ?? 'AI provider returned an error.'], JSON_UNESCAPED_UNICODE); exit; }
$answer = $data['choices'][0]['message']['content'] ?? '';
if ($answer === '') { http_response_code(502); echo json_encode(['error'=>'AI returned an empty response.'], JSON_UNESCAPED_UNICODE); exit; }
echo json_encode(['answer'=>$answer], JSON_UNESCAPED_UNICODE);
