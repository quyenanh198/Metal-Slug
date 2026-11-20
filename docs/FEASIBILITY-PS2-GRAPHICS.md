# Đánh giá Độ khả thi & Hạn chế thiết kế: Đồ họa tương đương PlayStation (PS2) trên Web Local (Three.js)

## 1. Độ khả thi theo từng khía cạnh (so với *Metal Slug 3D* trên PS2 — 2006)

Về mặt **phần cứng & sức mạnh render**, WebGL 2 (Three.js) trên trình duyệt PC hiện đại **mạnh hơn PS2 gấp hàng chục lần** (PS2 chỉ có 32MB RAM, ~300–1500 tam giác/nhân vật, texture 256×256). Vì vậy, **nút thắt cổ chai không nằm ở công nghệ Web**, mà nằm ở **khối lượng sản xuất Art & Animation**:

| Hạng mục | Khả thi về Kỹ thuật (WebGL/Three.js) | Khả thi về Công sức (1 Dev + AI) | Ghi chú thực tế |
| :--- | :---: | :---: | :--- |
| **Hình học 3D (Polycount & Mesh)** | **10/10** | **7/10** | Model chuẩn PS2 (~1.5k–4k poly) chạy 60 FPS cực nhẹ trên Web. Cần Blender hoặc nguồn `.glb` (Mixamo/Quaternius/Sketchfab). |
| **Texture & Shader (Toon / Phong / Baked AO)** | **10/10** | **8/10** | Three.js hỗ trợ đầy đủ PBR, `MeshToonMaterial`, Normal Map, Emissive, Post-processing (Bloom). |
| **Animation nhân vật (chạy, bắn 8 hướng, lăn né, chết hài hước)** | **9/10** | **4.5/10** | **Điểm khó nhất.** Bản PS2 có hàng chục animation hài hước đặc trưng (rút súng, hốt hoảng, nổ tung). Làm thủ công rất tốn thời gian; cần dùng **Mixamo** + **AnimationMixer blending**. |
| **VFX Cháy nổ, Khói, Mảnh vỡ & Phá hủy** | **9/10** | **7/10** | Dùng InstancedMesh + Sprite Sheet nổ 2D/3D (billboard) là giống hệt kỹ thuật PS2 mà siêu nhẹ. |
| **Camera, Physics & Boss đa bộ phận** | **9.5/10** | **8/10** | 2.5D dễ làm & giữ đúng chất Metal Slug nhất; Full 3D cần thêm lock-on target + camera tránh tường. |

**Kết luận độ khả thi tổng thể:**
- **Đạt 80–90% chất lượng hình ảnh bản PlayStation (PS2) trên Web Local:** **Hoàn toàn khả thi** nếu bạn kết hợp **Three.js + Asset `.glb` chuẩn hóa (Blender/Mixamo) + Sprite VFX nổ + Post-processing nhẹ**.
- **Đạt 100% độ chi tiết hoạt họa/nội dung như studio SNK (20+ người làm 2 năm):** Không khả thi với 1 người nếu không thu hẹp quy mô (còn 1–3 màn chơi, 1–2 Boss, tái sử dụng skeleton địch).

---

## 2. Các hạn chế thiết kế (Design & Technical Constraints) trên Web Local

1. **Thiếu 3D Level Editor trực quan:**
   - Khác với Unity/Godot, Three.js không có Scene Editor kéo-thả.
   - *Giải pháp:* Dựng map trong **Blender** (gắn empty node đánh dấu vị trí spawn địch, thùng gỗ, POW) rồi xuất `.glb` nạp vào Three.js, hoặc dùng file `level1.json`.
2. **Giới hạn Draw Calls & Garbage Collection (JS):**
   - Trong Metal Slug, có lúc trên màn hình xuất hiện 50+ viên đạn, vỏ đạn, mảnh vỡ và 10 vụ nổ cùng lúc. Tạo/xóa `THREE.Mesh` liên tục sẽ gây giật khung hình (GC spikes).
   - *Giải pháp:* Bắt buộc dùng **Object Pooling** và **`THREE.InstancedMesh`** cho đạn, vỏ đạn, mảnh gỗ/khói.
3. **Animation Blending trên 3D Skeleton (`.glb`):**
   - Bản PlayStation cho phép thân dưới chạy trong khi thân trên xoay ngắm bắn các hướng.
   - *Giải pháp:* Tách bone hoặc dùng `AnimationMixer` với trọng số (additive/masked animations), hoặc xoay trực tiếp bone cột sống (`spine`) theo góc ngắm trong code.
4. **Hạn chế trình duyệt khi chơi LAN:**
   - **Autoplay Audio:** Âm thanh chỉ phát sau click/phím đầu tiên.
   - **WebSocket (TCP) vs UDP:** Trình duyệt không mở được raw UDP socket; tuy nhiên trong **mạng LAN (ping 1–5 ms)**, WebSocket (`ws`) chạy ở 30–60Hz hoàn toàn đủ mượt cho Co-op 2–4 người.
   - **Tải Asset ban đầu:** Giữ tổng dung lượng `.glb` + texture dưới **30–50 MB** (nén Draco + KTX2/WebP) để máy trong LAN load trong 1–2 giây.
