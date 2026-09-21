# BÁO CÁO RECONCILIATION: QUY CHẾ KINH DOANH GÓI NPP (NHÀ PHÂN PHỐI)
**Mã tài liệu**: `NPP_BUSINESS_RULE_RECONCILIATION.md`  
**Giai đoạn**: PHASE 1 — BUSINESS RULE RECONCILIATION  
**Trạng thái**: READ-ONLY / NO CODE / NO MIGRATION / NO DEPLOY  
**Căn cứ pháp lý & Kỹ thuật**: 15 Business Rules NPP Chính thức & Baseline `CTV_SYSTEM_BASELINE.md`

---

## A. CÁC QUY TẮC ĐÃ CHỐT CHÍNH THỨC (FINALIZED RULES)

Dưới đây là 15 nguyên tắc kinh doanh chính thức, là **Source of Truth** tối cao cho toàn bộ hệ thống NPP:

1. **NPP và Rank là 2 khái niệm độc lập cùng tồn tại trên một User**:
   - `NPP` là một trạng thái/loại thành viên (Membership/Partner Status: `isNpp = true/false`).
   - `Rank` là Cấp bậc kinh doanh kỹ thuật (`AMBASSADOR`, `MANAGER`, `DIRECTOR`) hiển thị ra ngoài là **Đại sứ**, **Trưởng nhóm**, **Quản lý**.
   - `NPP` **KHÔNG PHẢI** là một Rank. Mua gói NPP sẽ xác lập hoặc thay đổi Rank hiện tại theo cấu hình của gói.
2. **NPP không dùng và không tác động đến `qualifyingPoints`**:
   - `qualifyingPoints` (QP) là điểm tích lũy doanh số bán lẻ CTV thông thường để chạm mốc 5.000 CP.
   - Gói NPP **KHÔNG CỘNG 5.000 QP** vào tài khoản User. Điểm QP thực tế giữ nguyên.
3. **Nguyên tắc Duy nhất 1 BID suốt đời (Single Lifetime BID)**:
   - Mỗi User chỉ có tối đa **1 mã BID duy nhất** (`WK-xxxxx`).
   - Nếu User đã có BID trước đó -> Giữ nguyên BID.
   - Nếu User chưa có BID -> Cấp phát BID ngay khi gói NPP đạt `COMPLETED` và Kế toán xác nhận đã thanh toán đủ 100%. Không bao giờ sinh BID thứ 2.
4. **Giao dịch Gói NPP là Transaction Type riêng biệt**:
   - Mua gói NPP là loại giao dịch độc lập (`NPP_PACKAGE_PURCHASE`).
   - **TUYỆT ĐỐI KHÔNG** chạy engine hoa hồng CTV lên từng sản phẩm/linh kiện bên trong gói.
   - **TUYỆT ĐỐI KHÔNG** phát sinh hoa hồng `SELF` hay `DIRECT` theo tỷ lệ CTV bán lẻ.
5. **Cơ chế Hoa hồng Gói NPP: F1 = 10%, F2 = 5%**:
   - Áp dụng đúng **2 cấp bảo trợ trực tiếp** bên trên người mua gói cho MỖI giao dịch gói:
     - F1 (Sponsor trực tiếp của người mua): Nhận **10%**.
     - F2 (Sponsor của F1): Nhận **5%**.
     - F0 / F3 trở lên: Nhận **0%**.
   - Cây bảo trợ có thể sâu vô hạn, nhưng hoa hồng gói NPP luôn chỉ truy ngược đúng 2 tầng từ vị trí người mua gói.
6. **Căn cứ Tính Hoa hồng Gói (Commission Base)**:
   - Tính trên **SỐ TIỀN THỰC THU (ACTUAL PAID AMOUNT)** sau khi đã trừ chiết khấu (Discount).
   - Công thức: `Commission = Actual Paid Amount * Rate%`.
   - Quy đổi: `1 CP = 1.000 VNĐ`.
   - **KHÔNG DÙNG** `commissionPoints` cố định cho gói NPP.
7. **Quy chế Đặt cọc (Deposit)**:
   - Trạng thái `DEPOSIT` **CHƯA PHẢI LÀ NPP**.
   - Khi đặt cọc: `NPP = NO`, chưa cấp BID, chưa kích hoạt Rank theo gói, Hoa hồng gói = 0.
   - Chỉ khi đơn chuyển sang `COMPLETED` **VÀ** Kế toán xác nhận đã thanh toán đủ 100% thì mới: Kích hoạt NPP, cấp BID (nếu chưa có), gán/cập nhật Rank, phát sinh hoa hồng gói.
8. **Thời hạn Gói (Expiry)**:
   - Gói NPP **KHÔNG CÓ HẠN DÙNG MẶC ĐỊNH (NO DEFAULT EXPIRY)**. Không thiết kế expiry field/cron job khi business chưa yêu cầu.
9. **Lịch sử Mua Nhiều Gói (Multiple Purchases)**:
   - Một User có thể mua nhiều gói NPP trong suốt vòng đời.
   - Hệ thống phải lưu trữ lịch sử từng lần mua trọn vẹn, không được ghi đè làm mất vết lịch sử.
10. **Quy tắc Thăng hạng / Hạ hạng (Rank Upgrade / Downgrade)**:
    - Nếu gói mới có cấu hình Rank thấp hơn gói cũ (hoặc ngược lại), Rank hiện tại của User sẽ thay đổi theo gói mới kể từ thời điểm gói mới `COMPLETED`.
    - **KHÔNG HỒI TỐ** hoa hồng trong quá khứ.
    - Hoa hồng đã chốt trong lịch sử phải lưu giữ snapshot đầy đủ: `rankAtCommission`, `rate`, `commissionBase`, `earnedPoints`, `earnedMoney`, `policyVersion`.
11. **Khóa Bảo Trợ Tuyệt Đối (Sponsor Lock)**:
    - Trường `User.parentId` đã có thì không bao giờ bị thay đổi bởi bất kỳ link giới thiệu nào. Mua gói NPP không làm thay đổi người bảo trợ.
12. **Mua Sản phẩm Lẻ Sau Khi Trở Thành NPP**:
    - NPP sau khi được kích hoạt vẫn có quyền mua sản phẩm bán lẻ thông thường.
    - Đơn mua sản phẩm lẻ tiếp tục chạy logic hoa hồng CTV hiện tại (với Rank hiện tại của NPP).
    - Phân định rõ ràng giữa giao dịch Gói NPP và giao dịch Sản phẩm bán lẻ.
13. **Cấu hình & Snapshot Gói NPP (Package Configuration & Snapshot)**:
    - Admin Portal tạo và cấu hình gói NPP: Gói có thể gồm 1 loại máy × số lượng, hoặc nhiều linh kiện/thiết bị × số lượng.
    - Khách hàng mua nguyên gói, **KHÔNG ĐƯỢC TỰ Ý BỎ LINH KIỆN**.
    - Lịch sử mua gói bắt buộc phải chụp lại snapshot cố định: Tên gói, mã gói, danh sách linh kiện kèm số lượng, giá niêm yết, chiết khấu, số tiền thực thu, rank được cấp, phiên bản chính sách. Sửa cấu hình gói ở tương lai không ảnh hưởng đến đơn đã mua.
14. **Gói NPP là Entity Độc Lập, Không Phải Product Thông Thường**:
    - Thiết kế entity riêng: `NppPackage`, `NppPackageItem`, `NppPurchase` (hoặc `UserNppPackage`).
15. **Ngăn chặn Tạo "Self-Customer" Record Giả Tạo**:
    - Tuyệt đối không để việc User tự mua gói NPP hoặc tự mua sản phẩm sinh ra một bản ghi `Customer` ảo đại diện cho chính mình chỉ để phục vụ liên kết khóa ngoại. Phải xử lý tận gốc kiến trúc quan hệ.

---

## B. QUY TẮC CTV NÀO ĐƯỢC TÁI SỬ DỤNG (REUSED CTV RULES)

1. **Hạ tầng Cây bảo trợ (`User.parentId`)**:
   - Sử dụng chung cây gia phả hiện tại. Mối quan hệ F0, F1, F2... được xác định xuyên suốt qua chuỗi `User.parentId`.
2. **Quy tắc Sponsor Lock**:
   - Tuyến trên cố định vĩnh viễn theo tài khoản User, không bao giờ thay đổi khi mua gói NPP.
3. **Mã kinh doanh định danh duy nhất (`businessId`)**:
   - Quy tắc sinh mã tự động `WK-xxxxx` tăng tuần tự và tính duy nhất trên toàn hệ sinh thái được tái sử dụng 100%.
4. **Vòng đời Đơn hàng Tổng thể**:
   - Tận dụng các trạng thái chuẩn: `NEW` ➔ `DEPOSIT` ➔ `CONFIRMED` ➔ `SHIPPING` ➔ `COMPLETED` (hoặc `CANCELLED`).
   - Tận dụng quy tắc: Chỉ tính hoa hồng và kích hoạt quyền lợi khi đơn hàng đạt `COMPLETED` và thanh toán đủ.
5. **Đơn vị Quy đổi Tiền tệ & Hoa hồng**:
   - `1 CP = 1.000 VNĐ`. Hoa hồng ghi nhận vào ví điểm / báo cáo thu nhập theo chuẩn quy đổi chung.
6. **Bộ Nhãn Cấp Bậc (Rank Display Labels)**:
   - `AMBASSADOR` hiển thị là **Đại sứ**.
   - `MANAGER` hiển thị là **Trưởng nhóm**.
   - `DIRECTOR` hiển thị là **Quản lý**.
7. **Luồng Sản phẩm Lẻ Thông thường**:
   - Toàn bộ cơ chế tính điểm QP, mốc 5.000 CP không split, tỷ lệ hoa hồng CTV lẻ (SELF, DIRECT, D1, D2) giữ nguyên vẹn cho các đơn hàng mua sản phẩm lẻ.

---

## C. QUY TẮC NPP NÀO HOÀN TOÀN RIÊNG BIỆT (STANDALONE NPP RULES)

1. **Trạng thái Đối tác NPP (`isNpp / nppStatus`)**:
   - Tồn tại song song với Rank. Một người có thể là `isNpp = true` với Rank = `AMBASSADOR` hoặc `isNpp = true` với Rank = `DIRECTOR`.
2. **Miễn trừ Tích lũy 5.000 QP**:
   - Kích hoạt thẳng quyền đối tác kinh doanh và cấp BID mà không cần chạm mốc 5.000 điểm tích lũy QP.
   - Không được ghi 5.000 điểm giả vào trường `qualifyingPoints`.
3. **Cơ chế Hoa hồng Gói Tách Biệt Tuyệt Đối**:
   - Không chạy qua hàm `calculateAndCreateCommissions` của CTV lẻ.
   - Không tính hoa hồng theo `commissionPoints` của từng linh kiện bên trong gói.
   - Hoa hồng gói chỉ tính theo % tiền thực thu: F1 = 10%, F2 = 5%.
   - Bản thân người mua gói **KHÔNG NHẬN HOA HỒNG SELF** trên gói NPP mình mua.
4. **Cơ chế Snapshot Gói Trọn Gói**:
   - Chụp toàn bộ danh mục linh kiện, số lượng, giá tiền, chiết khấu tại thời điểm mua thành một bản ghi bất biến.
5. **Xác thực Kế toán (Accounting Settlement Gate)**:
   - Gói NPP đòi hỏi điều kiện kép: `Status == COMPLETED` **VÀ** `isPaidInFull == true` (Kế toán đã thu đủ tiền) mới giải phóng hoa hồng và kích hoạt quyền lợi.

---

## D. MỐI QUAN HỆ: USER ↔ NPP ↔ RANK ↔ BID

```
                    +---------------------------------------+
                    |                 User                  |
                    +---------------------------------------+
                    | - id                                  |
                    | - userId (VD: U958)                   |
                    | - parentId (Sponsor userId)           |
                    | - isSystemParticipant (true/false)    |
                    | - qualifyingPoints (Doanh số lẻ CTV)  |
                    |                                       |
                    | [Cấp Bậc CTV]                         |
                    | - rank: AMBASSADOR / MANAGER / DIR... |
                    | - rankStatus: ACTIVE_RANK / ...       |
                    |                                       |
                    | [Mã Định Danh Duy Nhất]               |
                    | - businessId: WK-xxxxx (DUY NHẤT 1)   |
                    |                                       |
                    | [Trạng Thái Đối Tác NPP]              |
                    | - isNpp: true / false                 |
                    | - nppActivatedAt: DateTime?           |
                    +---------------------------------------+
                                        │ 1
                                        │ sở hữu lịch sử
                                        ▼ N
                    +---------------------------------------+
                    |              NppPurchase              |
                    +---------------------------------------+
                    | - id                                  |
                    | - packageId (FK -> NppPackage)        |
                    | - assignedRankAtPurchase              |
                    | - actualPaidAmount                    |
                    | - status (NEW/DEPOSIT/COMPLETED)      |
                    | - isPaidInFull (true/false)           |
                    | - snapshotJson (Full snapshot)        |
                    +---------------------------------------+
```

### Các Trường hợp Điển hình:
- **Trường hợp 1 (User mới toanh mua gói NPP có cấu hình Rank Đại sứ)**:
  - Trước đơn: `isNpp = false`, `businessId = null`, `rank = 'AMBASSADOR'`, `rankStatus = 'NOT_QUALIFIED'`, `qualifyingPoints = 0`.
  - Sau khi gói COMPLETED & thanh toán đủ:
    - `isNpp = true`.
    - Sinh `businessId = 'WK-10002'` (cấp mới).
    - `rank = 'AMBASSADOR'`, `rankStatus = 'ACTIVE_RANK'`.
    - `qualifyingPoints` **vẫn = 0** (không cộng 5.000 ảo).
- **Trường hợp 2 (CTV đã là Đại sứ có BID sẵn, mua gói NPP có cấu hình Rank Quản lý)**:
  - Trước đơn: `isNpp = false`, `businessId = 'WK-10001'`, `rank = 'AMBASSADOR'`, `qualifyingPoints = 5.200`.
  - Sau khi gói COMPLETED & thanh toán đủ:
    - `isNpp = true`.
    - `businessId` **giữ nguyên 'WK-10001'** (không cấp thêm BID mới).
    - `rank` nâng lên `'DIRECTOR'`.
    - `qualifyingPoints` **vẫn = 5.200**.

---

## E. VÒNG ĐỜI GÓI NPP (PACKAGE LIFECYCLE)

```
[ TẠO ĐƠN MUA GÓI ] ──> Status: NEW
                             │
                             ├────────────────────────────────┐
                             ▼                                ▼
                     Status: DEPOSIT                 Status: CONFIRMED
                     (Thanh toán cọc)                (Xác nhận đơn)
                             │                                │
                             └───────────────┬────────────────┘
                                             ▼
                                     Status: SHIPPING
                                     (Giao máy & linh kiện)
                                             │
                                             ▼
                                     Status: COMPLETED
                                             │
                             [ KẾ TOÁN XÁC NHẬN ĐỦ TIỀN? ]
                                      │           │
                                 CHƯA │           │ ĐÃ THU ĐỦ (isPaidInFull = true)
                                      ▼           ▼
                           [ GIỮ TRẠNG THÁI ]  [ KÍCH HOẠT QUYỀN LỢI TOÀN DIỆN ]
                           - Chưa cấp BID      - isNpp = true
                           - Chưa đổi Rank     - Cấp BID (nếu chưa có)
                           - Hoa hồng PENDING  - Cập nhật User.rank theo gói
                                               - Giải phóng hoa hồng F1 (10%), F2 (5%)
```

---

## F. VÒNG ĐỜI HOA HỒNG GÓI NPP (PACKAGE COMMISSION LIFECYCLE)

### 1. Nguyên tắc Tính toán:
- **Thời điểm tính toán**: Khi đơn mua gói đạt `COMPLETED` và Kế toán xác nhận đủ tiền.
- **Đối tượng thụ hưởng**:
  - `Buyer` = Người mua gói NPP.
  - `F1` = `User.findUnique({ where: { userId: Buyer.parentId } })`.
  - `F2` = `User.findUnique({ where: { userId: F1.parentId } })`.
- **Tỷ lệ**:
  - `F1`: Nhận `10%` trên `actualPaidAmount`.
  - `F2`: Nhận `5%` trên `actualPaidAmount`.
  - Không có hoa hồng `SELF` cho Buyer.
  - Tuyến F3 trở lên không nhận hoa hồng gói.

### 2. Trạng thái Hoa hồng Gói:
- Khi đơn đang ở `NEW`, `DEPOSIT`, `SHIPPING`: Không ghi nhận hoặc ghi nhận ở trạng thái `DRAFT` / `PENDING_PAYMENT` với giá trị khả dụng = 0.
- Khi đơn `COMPLETED` và thanh toán đủ 100%: Chuyển sang `AVAILABLE` (sẵn sàng đối soát chi trả).
- Nếu đơn bị `CANCELLED`: Toàn bộ hoa hồng liên quan bị hủy (`CANCELLED`), thu hồi quyền NPP và phục hồi Rank trước đó.

---

## G. CƠ CHẾ NÂNG CẤP / HẠ CẤP (UPGRADE / DOWNGRADE)

1. **Nguyên tắc Áp dụng**:
   - Một User có thể mua nhiều gói theo thời gian: Gói A ➔ Gói B ➔ Gói C.
   - Rank hiện tại của User (`User.rank`) sẽ được cập nhật theo cấu hình của **GÓI MỚI NHẤT VỪA KÍCH HOẠT**.
   - Dù gói mới có rank cao hơn (Upgrade) hay thấp hơn (Downgrade) so với rank hiện tại, hệ thống luôn tuân theo gói mới nhất kể từ ngày kích hoạt.
2. **Bảo toàn Dữ liệu Lịch sử (Không Hồi tố)**:
   - Tất cả các đơn hàng và hoa hồng đã settlement trước ngày kích hoạt gói mới **GIỮ NGUYÊN 100%**.
   - Không tính lại, không hồi tố, không truy thu hoa hồng cũ.

---

## H. QUY CHẾ CHỤP DỮ LIỆU LỊCH SỬ (HISTORICAL SNAPSHOT)

Mọi giao dịch mua gói NPP phải được snapshot đầy đủ thành một cấu trúc JSON bất biến (`snapshotJson`) tại thời điểm kích hoạt:
1. **Thông tin Gói**: `packageCode`, `packageName`, `packageType`.
2. **Danh mục Linh kiện/Máy**: Mảng `components: [{ productId, productCode, productName, quantity, unitPrice }]`.
3. **Thông tin Tài chính**: `grossPrice` (giá niêm yết), `discountPercentage`, `discountAmount`, `actualPaidAmount`.
4. **Thông tin Chính sách & Cấp bậc**: `assignedRank` (Rank được gán), `policyVersion`, `f1Rate` (10%), `f2Rate` (5%).
5. **Snapshot Hoa hồng Đã Phát sinh**:
   - F1: `beneficiaryUserId`, `rate = 10%`, `commissionBase`, `earnedMoney`, `earnedPoints`.
   - F2: `beneficiaryUserId`, `rate = 5%`, `commissionBase`, `earnedMoney`, `earnedPoints`.

*Ý nghĩa*: Khi Admin sửa đổi giá gói, thêm bớt linh kiện trong gói ở tương lai, toàn bộ dữ liệu lịch sử của khách hàng cũ hoàn toàn không bị ảnh hưởng.

---

## I. CÂY BẢO TRỢ & TRUY VẾT F1, F2 (SPONSOR TREE)

Cây bảo trợ lưu bằng trường `parentId` trên bảng `User`:

```
Ví dụ cấu trúc cây 5 tầng:
[ F0: U100 ]
     │
     ▼
[ F1: U200 ]
     │
     ▼
[ F2: U300 ]
     │
     ▼
[ F3: U400 ]
     │
     ▼
[ F4: U500 ] ──> MUA GÓI NPP (Thực thu = 200.000.000 VNĐ)
```

- **Truy vết trả thưởng cho đơn mua gói của F4 (U500)**:
  - F3 (U400 = Direct Sponsor của U500): Nhận `10% = 20.000.000 VNĐ` (20.000 CP).
  - F2 (U300 = Direct Sponsor của U400): Nhận `5% = 10.000.000 VNĐ` (10.000 CP).
  - F1 (U200) và F0 (U100): Nhận `0 VNĐ` (Hết giới hạn 2 cấp cho giao dịch gói).

---

## J. SO SÁNH: ĐƠN SẢN PHẨM LẺ VS ĐƠN GÓI NPP

| Tiêu chí | Đơn Hàng Sản Phẩm Lẻ (Retail Order) | Đơn Hàng Gói NPP (NPP Package Order) |
| :--- | :--- | :--- |
| **Đối tượng mua** | Khách hàng lẻ hoặc CTV tự mua | Đối tác phân phối (User) |
| **Bản chất hàng hóa** | Sản phẩm lẻ chọn theo giỏ hàng | Trọn gói máy móc & linh kiện đóng gói sẵn |
| **Cắt giảm linh kiện** | Tự do chọn số lượng sản phẩm | Mua nguyên gói, KHÔNG được bỏ linh kiện |
| **Căn cứ hoa hồng** | Dựa trên `commissionPoints` của từng item | Dựa trên **TIỀN THỰC THU** (`actualPaidAmount`) |
| **Các loại hoa hồng** | `SELF` (20-30%), `DIRECT` (10-20%), `D1` (10%), `D2` (5%) | **CHỈ CÓ 2 CẤP**: F1 = 10%, F2 = 5% |
| **Hoa hồng cho chính mình**| Có (`SELF` 20-30% nếu đã có BID) | **KHÔNG CÓ SELF** |
| **Ảnh hưởng `qualifyingPoints`**| Có cộng QP để xét mốc 5.000 CP | **KHÔNG CỘNG QP** |
| **Tác động Cấp bậc** | Tự động lên Đại sứ khi QP >= 5.000 | Gán/cập nhật Rank theo cấu hình gói ngay khi thanh toán đủ |
| **Cấp mã BID** | Cấp khi tích lũy đủ 5.000 QP | Cấp ngay khi hoàn tất đơn gói nếu chưa có |

---

## K. PHÂN TÍCH VẤN ĐỀ "SELF-CUSTOMER" & GIẢI PHÁP MỞ RỘNG AN TOÀN

### 1. Hiện trạng Dependency trong Source Code Hiện tại:
- Trong `schema.prisma`: `Order` có trường bắt buộc `customerId String` (`customer Customer @relation(...)`).
- Trong `server/index.js`: Khi một CTV tự mua hàng (Self-purchase), hệ thống chạy logic:
  ```javascript
  let customer = await prisma.customer.findFirst({ where: { linkedUserId: user.id } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { code: 'KH-...', name: user.name, phone: user.phone, linkedUserId: user.id, sponsorUserId: user.id }
    });
  }
  ```
- **Hệ quả tiêu cực**: Tạo ra các bản ghi `Customer` ảo đại diện cho chính User, làm ô nhiễm danh bạ khách hàng thực tế và gây hiểu nhầm trong báo cáo CRM.

### 2. Giải pháp Đề xuất An Toàn Tuyệt Đối cho Gói NPP:
- **Tách riêng Entity Giao dịch Gói NPP**:
  - Thay vì ép đơn mua gói NPP vào bảng `Order` bán lẻ (vốn bị trói buộc bởi `customerId`), ta thiết kế bảng giao dịch riêng: `NppPurchase` (hoặc `UserNppPackage`).
  - Trong `NppPurchase`, trường người mua là `userId String` trỏ trực tiếp đến `User.id` (`buyer User @relation(...)`).
  - **KẾT QUẢ**: Không phụ thuộc vào `customerId`, **KHÔNG BAO GIỜ sinh ra bản ghi Customer ảo** khi mua gói NPP.
- **Đối với Đơn Sản Phẩm Lẻ sau này (Phase 2 xem xét)**:
  - Khi cần làm sạch cho đơn sản phẩm lẻ, có thể chuyển `Order.customerId` thành `customerId String?` (nullable) và bổ sung `buyerUserId String?` để CTV tự mua hàng trỏ trực tiếp đến User mà không cần tạo Customer ảo.

---

## L. CÁC THỰC THỂ DATABASE DỰ KIẾN (CHO PHASE 2)

*(Đề xuất kiến trúc khái niệm — Chưa tạo migration, chưa chạy Prisma)*

### 1. `NppPackage` (Định nghĩa Gói NPP do Admin quản lý)
- `id`: String (PK)
- `code`: String (Unique, VD: `NPP-GOLD-01`)
- `name`: String (Tên gói, VD: `Gói Nhà Phân Phối Vàng`)
- `description`: String?
- `grossPrice`: Float (Giá niêm yết)
- `defaultDiscount`: Float (Tỷ lệ chiết khấu mặc định, VD: 25%)
- `assignedRank`: String (Rank kích hoạt: `AMBASSADOR`, `MANAGER`, `DIRECTOR`)
- `isActive`: Boolean (true/false)
- `createdAt`, `updatedAt`

### 2. `NppPackageItem` (Linh kiện / Máy cấu thành trong Gói)
- `id`: String (PK)
- `packageId`: String (FK -> `NppPackage.id`)
- `productId`: String (FK -> `Product.id`)
- `quantity`: Int (Số lượng linh kiện/máy)
- `note`: String?

### 3. `NppPurchase` (Giao dịch Mua Gói NPP của Thành viên)
- `id`: String (PK)
- `code`: String (Unique, VD: `NPP-ORD-1001`)
- `userId`: String (FK -> `User.id` - Người mua gói)
- `packageId`: String (FK -> `NppPackage.id`)
- `grossPrice`: Float
- `discountAmount`: Float
- `actualPaidAmount`: Float (Căn cứ tính hoa hồng)
- `depositAmount`: Float (Số tiền cọc)
- `status`: String (`NEW`, `DEPOSIT`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`)
- `isPaidInFull`: Boolean (Kế toán duyệt thu đủ 100%)
- `paidInFullAt`: DateTime?
- `assignedRankAtPurchase`: String
- `snapshotJson`: String (JSON snapshot toàn vẹn linh kiện, giá, rank, policy)
- `createdAt`, `updatedAt`

### 4. `NppCommission` (Hoa hồng từ Giao dịch Gói NPP)
- `id`: String (PK)
- `purchaseId`: String (FK -> `NppPurchase.id`)
- `beneficiaryId`: String (FK -> `User.id`)
- `level`: Int (1 = F1, 2 = F2)
- `rate`: Float (10.0 hoặc 5.0)
- `commissionBase`: Float (Bằng `actualPaidAmount`)
- `earnedMoney`: Float (`commissionBase * rate / 100`)
- `earnedPoints`: Float (`earnedMoney / 1000`)
- `status`: String (`PENDING_PAYMENT`, `AVAILABLE`, `PAID`, `CANCELLED`)
- `createdAt`, `settledAt`

---

## M. TỔNG HỢP CÁC ĐIỂM NGHIỆP VỤ & KẾT LUẬN

### 1. Rà soát Mâu thuẫn (Contradiction Check):
- Không còn bất kỳ mâu thuẫn nào giữa Baseline CTV cũ và 15 Rule NPP mới.
- Toàn bộ các câu hỏi nghiệp vụ đã được làm rõ và khẳng định dứt khoát:
  - `qualifyingPoints` không cộng điểm ảo 5.000.
  - Không split đơn gói, không dùng `commissionPoints` của sản phẩm lẻ cho gói.
  - Cấp duy nhất 1 BID suốt đời.
  - Hoa hồng gói chỉ trả 2 cấp: F1 = 10%, F2 = 5% trên số tiền thực thu.
  - Phân tách độc lập hoàn toàn giữa thực thể gói NPP và sản phẩm lẻ để ngăn chặn lỗi Customer ảo.

---

READY FOR PHASE 2: DATABASE DESIGN
