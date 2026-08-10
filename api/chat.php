<?php
// INDUSTRIA AI - PHP 8.4 backend
// Gemini API key must stay on the server. Never expose it to JavaScript.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed'], JSON_UNESCAPED_UNICODE); exit; }

$configPath = __DIR__ . '/../config/config.php';
if (!is_file($configPath)) { http_response_code(500); echo json_encode(['error'=>'Backend config is missing. Create config/config.php from config.example.php.'], JSON_UNESCAPED_UNICODE); exit; }
$config = require $configPath;
$apiKey = trim((string)($config['gemini_api_key'] ?? ''));
$model = trim((string)($config['gemini_model'] ?? 'gemini-flash-latest'));
if ($apiKey === '' || $apiKey === 'PUT_YOUR_KEY_HERE') { http_response_code(503); echo json_encode(['error'=>'GEMINI_API_KEY is not configured on the server.'], JSON_UNESCAPED_UNICODE); exit; }

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
$message = trim((string)($body['message'] ?? ''));
$history = is_array($body['history'] ?? null) ? $body['history'] : [];
if ($message === '') { http_response_code(400); echo json_encode(['error'=>'Message is required.'], JSON_UNESCAPED_UNICODE); exit; }

$systemInstruction = 'تو دستیار هوشمند INDUSTRIA AI هستی. به زبان فارسی پاسخ بده، دقیق و کاربردی باش. در موضوعات صنعتی، ابزار، تجهیزات و خرید محصول، ابتدا نیاز کاربر را روشن کن و سپس پیشنهاد منطقی بده. اگر اطلاعات کافی نداری، حدس قطعی نزن.';
$contents = [];
foreach (array_slice($history, -10) as $item) {
  $role = ($item['role'] ?? '') === 'assistant' ? 'model' : 'user';
  $content = trim((string)($item['content'] ?? ''));
  if ($content !== '') $contents[] = ['role'=>$role, 'parts'=>[['text'=>$content]]];
}
$contents[] = ['role'=>'user', 'parts'=>[['text'=>$message]]];

$payload = json_encode([
  'systemInstruction' => ['parts'=>[['text'=>$systemInstruction]]],
  'contents' => $contents,
  'generationConfig' => ['temperature'=>0.5]
], JSON_UNESCAPED_UNICODE);

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json','X-goog-api-key: '.$apiKey],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_TIMEOUT => 45,
]);
$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) { http_response_code(502); echo json_encode(['error'=>'AI connection failed: '.$curlError], JSON_UNESCAPED_UNICODE); exit; }
$data = json_decode($response, true);
if ($http < 200 || $http >= 300) { http_response_code(502); echo json_encode(['error'=>$data['error']['message'] ?? 'Gemini returned an error.'], JSON_UNESCAPED_UNICODE); exit; }

$answer = '';
foreach (($data['candidates'][0]['content']['parts'] ?? []) as $part) {
  if (isset($part['text'])) $answer .= $part['text'];
}
$answer = trim($answer);
if ($answer === '') { http_response_code(502); echo json_encode(['error'=>'AI returned an empty response.'], JSON_UNESCAPED_UNICODE); exit; }
echo json_encode(['answer'=>$answer], JSON_UNESCAPED_UNICODE);
