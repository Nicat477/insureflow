# InsureFlow — Sığorta idarəetmə portalı

InsureFlow React, TypeScript və Node.js ilə hazırlanmış ikidilli portfel layihəsidir. Azərbaycan dili standart dildir; başlıqda AZ/EN seçimi ilə dili dəyişmək mümkündür. Seçim brauzerdə yadda saxlanılır.

> Bütün məlumatlar, qiymətlər və ödənişlər uydurmadır. Emlax, Bitrix24 və 1C yalnız demo xidmətləridir. Şəxsi və maliyyə məlumatları daxil etməyin.

## Lokal işə salma (Windows)

Birinci terminal: `cd backend`, `npm.cmd start`.

İkinci terminal: `cd frontend`, `pnpm.cmd install --frozen-lockfile`, `pnpm.cmd run dev`.

Brauzerdə http://localhost:5173 ünvanını açın.

## Demo əməliyyatı

1. Sığorta → Müraciətlər bölməsində rezervasiya edilmiş əmlakı seçin və müraciət yaradın.
2. CRM ilə sinxronlaşdırın.
3. Dəqiq məbləğ ssenarisini seçərək demo ödəniş yaradın və uyğunluğu yoxlayın.
4. Sığorta polisini rəsmiləşdirin. Polislər, ödənişlər və inteqrasiyalar bölmələrində nəticələrə baxın.
5. Sığorta hadisələri bölməsində aktiv polis üzrə müraciət yaradın.

## Yoxlama

Frontend: `pnpm.cmd run build`, `pnpm.cmd test`. Backend: `npm.cmd test`.

Hər iki dildə bütün əsas səhifələri, forma seçimlərinin API-yə göndərilən dəyişməz dəyərlərini, statusları, bildirişləri, tarixləri və valyuta formatlarını yoxlayın. Dil dəyişikliyi formadakı məlumatları və biznes məntiqini dəyişməməlidir.

Əlavə texniki məlumat: [English README](README.md).
