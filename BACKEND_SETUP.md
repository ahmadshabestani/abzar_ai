# اتصال AI واقعی برای INDUSTRIA AI

Frontend روی GitHub Pages می‌تواند بماند، اما کلید API نباید داخل HTML/JS قرار بگیرد. Backend این پروژه به‌صورت Vercel Serverless Function در `api/chat.js` آماده شده است.

## 1) Deploy Backend

در Vercel یک پروژه جدید بساز و همین repository (`ahmadshabestani/abzar_ai`) را Import کن.

- Framework Preset: Other
- Root Directory: `/`
- Build Command: خالی
- Output Directory: خالی

## 2) Environment Variables

در Vercel → Settings → Environment Variables این متغیرها را اضافه کن:

`OPENAI_API_KEY` = کلید API واقعی

اختیاری:

`OPENAI_MODEL` = `gpt-5-mini`

کلید را هرگز داخل `app.js`، `index.html` یا GitHub commit قرار نده.

## 3) وصل کردن Frontend

بعد از Deploy، آدرس Backend چیزی شبیه این خواهد بود:

`https://YOUR-PROJECT.vercel.app/api/chat`

برای اتصال Frontend فعلی، در Console مرورگر اجرا کن:

`localStorage.setItem('industria_api_url','https://YOUR-PROJECT.vercel.app/api/chat')`

سپس صفحه را Refresh کن.

برای نسخه نهایی بهتر است URL Backend را به‌صورت تنظیمات build یا فایل config عمومی پروژه قرار دهیم؛ خود API Key همچنان فقط روی Backend می‌ماند.

## وضعیت فعلی

- UI و PWA: آماده
- Voice input: آماده در مرورگرهای پشتیبان
- API endpoint: آماده
- اتصال واقعی AI: بعد از Deploy کردن Backend و قراردادن `OPENAI_API_KEY`
- دیتابیس محصولات: مرحله بعد
- جستجوی محصول و مقایسه واقعی: مرحله بعد
- تحلیل تصویر و فایل: مرحله بعد
