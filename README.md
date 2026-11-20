# Metal Slug 3D — Web Local Prototype

Bản prototype 3D Run-and-Gun lấy cảm hứng từ **Metal Slug** chạy trực tiếp trên trình duyệt (Web Local / LAN), xây dựng bằng **Three.js + Vite**, hỗ trợ cả **Bàn phím** và **Tay cầm PlayStation / Xbox (Gamepad API)**.

## Chạy nhanh (hỗ trợ mở qua LAN `--host`)
```bash
npm install
npm run dev
```

## Điều khiển
- `A` / `D` hoặc `⬅️` / `➡️`: Di chuyển
- `W` / `S` hoặc `⬆️` / `⬇️`: Ngắm lên / Ngồi né đạn
- `Space` / `K`: Nhảy
- `J` / Click chuột trái: Bắn súng (`Handgun`, `HMG`, `Shotgun`, `Rocket`)
- `G` / `L`: Ném lựu đạn (hoặc bắn đại bác khi lái xe tăng)
- `E`: Lên / Nhảy khỏi xe tăng **SV-001 Metal Slug**
- **Tay cầm PS/Xbox:** Cắm vào máy là tự nhận (D-Pad/Stick di chuyển, `X/A` nhảy, `Vuông/R2` bắn, `Tròn/R1` lựu đạn, `Tam giác/Y` lên/xuống xe tăng).

## Tài liệu đánh giá
- [Đánh giá độ khả thi đồ họa chuẩn PlayStation & Hạn chế thiết kế](docs/FEASIBILITY-PS2-GRAPHICS.md)
