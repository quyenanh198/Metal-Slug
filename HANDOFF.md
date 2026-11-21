# Handoff — Metal Slug 3 Mission 1 (arcade, chơi local)

Cập nhật: 2026-11-20. Bản làm lại Mission 1 của Metal Slug 3 theo kiểu arcade, chạy trên trình duyệt, chỉ chơi local
(không thương mại; art thuộc SNK).

## 1. Trạng thái hiện tại

Chơi được trọn Mission 1 từ đầu đến cuối:

| Phần | Trạng thái |
| :--- | :--- |
| Màn hình | 304×224, phóng to theo bội số nguyên, giữ nét pixel. Logic 60 Hz cố định. |
| Marco | Chân và thân trên là hai sprite riêng: chạy, nhảy, ngồi, bắn ngang/lên, dao, lựu đạn, chết, thắng. |
| Luật | Trúng 1 phát là chết, 2 mạng, TIME 60, CONTINUE, GAME OVER. Đạn không xuyên; súng lục vô hạn. |
| Vũ khí | P (súng lục), H, R, S lấy từ POW; hết đạn thì quay về P. Tự chuyển sang dao khi đứng sát địch. 10 lựu đạn. |
| Lính Rebel | Đứng / tán gẫu → giật mình → lao vào chém hoặc ném lựu đạn cán dài. Có hai kiểu chết (bị bắn, bị chém). |
| Cua | Chowmein Conga (6 máu) ở bãi biển và xác tàu: bò tới Marco, vung càng tạo lốc cát (trúng là chết), chết tan chảy. Súng lục trừ 1, dao/shotgun trừ 3, lựu đạn/rocket trừ 4. |
| POW | Cởi trói → đi tới → đưa vật phẩm → chào → chạy đi. |
| Màn chơi | Bãi biển → xác tàu → cầu đầm lầy → rừng. Camera chỉ tiến lên, dừng ở đợt địch rồi hiện biển "GO!". |
| Chữ trên màn hình | Màn tiêu đề ghép từ logo gốc (METAL SLUG, số 3 trong móng vuốt). "MISSION 1 START!", "MISSION 1 COMPLETE!", "GAME OVER", "CONTINUE?" dùng font lớn gốc, hiện từng chữ. Số đếm CONTINUE màu bạc gốc. Biển "GO!" có mũi tên chuyển động. |
| Boss | Huge Hermit trên biển hoàng hôn, Marco đứng trên phà Slug Transport Ferry. Giai đoạn 1 cầu lửa, giai đoạn 2 (còn nửa máu) bung pháo lớn, phà bị phá dần tới khi còn thùng SV-001. Hạ boss là MISSION COMPLETE. |
| Test | 20 test (`npm test`), có bot bất tử chơi hết màn và hạ boss. |

## 2. Chạy và kiểm tra

```bash
npm install
npm run dev      # http://localhost:5174 ; thêm #debug để có window.__ms3 = { game, assets, step }
npm test         # node --test tests/*.test.js
npm run build
npm run atlas    # build lại public/assets/ms3/ từ art-source/ (cần khi sửa tools/ms3-manifest.mjs)
```

Kiểm tra bằng mắt: chạy `npm run atlas`, rồi xem `tools/out/montage.png` (mỗi hoạt ảnh một hàng).
Để tìm toạ độ trên sheet: `node tools/sheet.mjs preview "<sheet>" x y w h scale out.png [--gap N]`.

## 3. Kiến trúc

```
src/arcade/game.js    luật chơi, không đụng DOM: createGame / startGame / step(g, input). Phase: title, playing,
                      continue, gameover, complete. Boss: enterArena, stepBoss, hitBoss (BOSS_HP = 160).
src/arcade/level.js   PIECES (3 đoạn nền + đường mặt đất), SCRIPT (địch/POW/item/lock theo camX), ARENA (sân boss
                      tại x = 5400, mặt sàn phà), groundAt(x).
src/arcade/render.js  drawMission / drawArena / drawActors / drawHud; hiệu ứng tối dần khi chuyển cảnh.
src/arcade/assets.js  nạp atlas, drawFrame / drawAnim / drawText (font điểm).
src/arcade/input.js   bàn phím, chuột, gamepad; "tap latch" giữ lại các lần nhấn ngắn hơn 1 khung hình.
src/arcade/audio.js   âm thanh tổng hợp bằng WebAudio, map theo tên sự kiện (g.events).
src/main.js           canvas, scale, vòng lặp bước cố định.
tools/                pipeline cắt sprite: sheet.mjs (dò khung), ms3-manifest.mjs (danh sách hoạt ảnh),
                      build-atlas.mjs (xếp atlas + montage).
art-source/Metal Slug 3/   138 sheet gốc (nguồn; không phục vụ trực tiếp cho game).
```

Luồng một màn chơi: `SCRIPT` tạo địch khi camera tới `at`. Gặp `lock` thì camera dừng tới khi hết địch.
Lock `final` → chuyển cảnh (`g.transition`) → `enterArena` → boss → `complete`.

## 4. Những điều cần biết trước khi sửa

- **Xuống dòng:** các file trong `src/` và `tests/` dùng CRLF. Khi thay chuỗi bằng script, chuẩn hoá về `\n` rồi ghi lại CRLF.
- **Hướng sprite:** Rebel và POW quay mặt sang trái, nên vẽ lật khi `facing > 0`. Huge Hermit quay sang phải.
- **Sheet gốc:**
  - Mỗi hàng sprite có một dòng chữ nhãn ngay phía trên. `region` phải bắt đầu dưới dòng nhãn đó.
  - Sheet Mission 1 có nền hồng `[248,0,248]`, phải khai báo `bg` rõ ràng.
- **Manifest:** `cellBg` lấy màu nền theo từng ô; `extraBg` bỏ thêm màu nền khác (vd. trắng); `flood` chỉ xoá nền nối với mép khung (giữ phần sáng cùng màu bên trong); `trimX` cắt cột trống hai bên. `sortX` giữ thứ tự khung từ trái sang phải. `pick` chọn khung con. `out` xuất ra layer PNG riêng cho nền lớn.
- **Neo khung:** mặc định neo ở đáy-giữa (chân). Dùng `anchor: 'center'` cho đạn và `'topleft'` cho font.
- **Thay đổi luật chơi:** thêm test trong `tests/arcade.test.js`. Bot ở cuối file phải luôn hoàn thành màn.
- **Danh tính git:** Quyen Nguyen, email noreply của GitHub (đã cấu hình local trong repo này).

## 5. Còn khác bản gốc (nợ kỹ thuật)

- Bố cục Mission 1 do tự ghép: ba đoạn nền, đường mặt đất ước lượng bằng tay, kịch bản địch tự đặt.
  MS3 thật có 3 nhánh đường; bản này chỉ có một.
- Kiểu tấn công, máu và nhịp của boss là ước lượng, không phải số liệu gốc.
- Bầu trời sân boss được kéo giãn từ dòng chân trời của nền, nên hơi có sọc dọc.
- Shotgun chưa có sprite riêng. Lựu đạn của Marco vẽ bằng code.
- Âm thanh là tiếng tổng hợp; thư mục không có file âm thanh gốc.
- Tên vũ khí khi nhặt (HEAVY MACHINE GUN…) vẫn là font điểm phóng to; arcade chỉ đọc bằng giọng.
- `atlas.png` khoảng 4,6 MB (khung boss lớn). Chưa nén palette.

## 6. Lộ trình (theo thứ tự ưu tiên)

Đã xong: biển chữ và màn tiêu đề gốc; cua Chowmein Conga.

1. **Xe Metal Slug (SV-001).**
   - Sprite lấy từ `Metal Slug [32523].png`.
   - Cho Marco lên xe ở đoạn rừng: pháo chính bắn theo hướng ngắm, súng máy vulcan, nhảy, thanh máu xe, và nhảy ra khỏi xe.
   - Đây là phần lớn nhất. Nên tách thành module riêng `src/arcade/slug.js`.
2. **Hoàn thiện boss.**
   - Thêm hiệu ứng nước bắn (`SPLASH SFX` trên sheet Huge Hermit) khi đạn pháo rơi xuống biển.
   - Thêm khói và đạn rơi vỏ.
   - Chỉnh nhịp tấn công theo video arcade.
3. **Đo lại mặt đất và kịch bản.** Đối chiếu với video longplay MS3 Mission 1: vị trí lock, số lính, vị trí POW và đường đi trên xác tàu.
4. **Cua lớn Ohumein Conga** (sheet cùng tên, 1455×1902) làm mini-boss; thêm đòn phun bọt của Chowmein Conga.
5. **Nén atlas.** Lượng tử hoá palette khi build, hoặc tách atlas boss ra file riêng và chỉ nạp khi vào sân boss.
6. **Âm thanh.** Nếu có file âm thanh gốc (local), thêm bộ nạp theo tên sự kiện và giữ âm tổng hợp làm dự phòng.
7. **Mở rộng.**
   - Thêm hai nhánh còn lại của Mission 1: nhánh dưới nước và nhánh hang.
   - Sau đó tới Mission 2.
   - Mỗi mission là một bộ `PIECES` + `SCRIPT` + arena riêng. Nên đưa `level.js` sang dạng dữ liệu theo mission trước khi làm.

Với mỗi bước:
1. Sửa manifest rồi chạy `npm run atlas` và xem montage.
2. Viết logic kèm test.
3. Chụp màn hình bằng Playwright để soát.
4. Mở PR vào `main`.
