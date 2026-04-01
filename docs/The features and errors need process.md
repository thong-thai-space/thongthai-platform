AUDIT TOAN DIEN THONGTHAI SPACE
I. CAU TRUC CODE - DAT CHUAN ENTERPRISE CHUA?
Backend (NestJS) - 7/10
Dat chuan:

Module structure ro rang (16 modules, tach biet trach nhiem)
DTO validation day du voi class-validator + whitelist
Guard/Decorator pattern chuan (JWT, RolesGuard, @Roles, @CurrentUser)
Prisma module global, lifecycle hooks dung
CHUA dat chuan enterprise:

Van de	Muc do	Chi tiet
Thieu Repository layer	HIGH	Tat ca 16 modules goi Prisma truc tiep tu Service. Enterprise can: Controller -> Service -> Repository -> Prisma
Thieu Response Envelope	HIGH	Khong co format chuan { success, data, error, meta }. Moi endpoint tra ve format khac nhau
Thieu API versioning	HIGH	Dung /api/projects thay vi /api/v1/projects. Thay doi API se break clients
Thieu Global Exception Filter	MEDIUM	Thu muc shared/filters/ rong. Khong co bo loc loi tap trung
Thieu Response Interceptor	MEDIUM	Thu muc shared/interceptors/ rong. Khong co transform response
Thieu barrel exports	LOW	Chi 1 file index.ts trong toan backend
Frontend (Next.js) - 5.4/10
Van de	Muc do	Chi tiet
Tat ca components la "use client"	HIGH	0 Server Components. Khong tan dung SSR/RSC cua Next.js 15
Thieu Error Boundaries	HIGH	Khong co error.tsx nao. Component crash = trang trang
Thieu loading.tsx	MEDIUM	Khong co skeleton loaders cho route transitions
7 components vuot 200+ dong	MEDIUM	ai-strategic-plan.tsx (320), ai-task-breakdown.tsx (290), portfolio-page-content.tsx (287)...
Sidebar/Header trung lap x3	MEDIUM	Dashboard, Member, Portal sidebar/header gan giong het nhau
Dung <img> thay vi Next.js Image	MEDIUM	4+ file dung <img> khong optimize
chat-store.ts tu viet thay vi Zustand	LOW	Tu implement observer pattern, thieu benefits cua Zustand
II. LO HONG BAO MAT
CRITICAL (Can fix ngay)
#	Lo hong	File	Van de
1	IDOR - Invoice	invoice.controller.ts:35-37	GET /invoices/:id khong kiem tra quyen. User bat ky doc duoc MOI hoa don
2	IDOR - Task	task.controller.ts:42-45	GET /tasks/:id khong kiem tra quyen. Doc duoc MOI task
3	IDOR - File read	file.controller.ts:34-37	GET /files/:id khong kiem tra quyen. Tai duoc MOI file
4	IDOR - File delete	file.controller.ts:78-81	DELETE /files/:id khong kiem tra quyen. Xoa duoc MOI file
5	IDOR - Notification	notification.controller.ts:66-77	markAsRead va delete khong check userId. User A xoa notification cua User B
6	IDOR - Message	message.service.ts:160-174	findConversation khong check user co quyen doc tin nhan giua 2 nguoi khac
7	File metadata unprotected	file.controller.ts:63-76	POST /files/metadata khong co RolesGuard. Tao fake file records cho project bat ky
8	Account overwrite	auth.service.ts:26-67	Email chua verify -> nguoi khac dang ky cung email -> ghi de tai khoan
HIGH (Can fix trong sprint nay)
#	Lo hong	File	Van de
9	Brute force login/register	auth.controller.ts:71-86	Khong co rate limit rieng. Chi co global 100 req/60s
10	Weak change-password	change-password.dto.ts	Chi yeu cau MinLength(6). Register yeu cau uppercase+lowercase+digit+special+8 chars
11	Email enumeration	auth.service.ts:26-67	Register tra ve "Email already registered" -> lo email nao da dang ky
12	Brute force verify-email	auth.controller.ts:88-97	Khong rate limit. Co the brute force token
13	Token refresh race condition	auth.service.ts:253-278	2 request refresh dong thoi -> 1 token bi invalid
14	Logout khong invalid access token	auth.service.ts:245-251	Chi xoa refreshTokenHash. Access token van dung duoc 15 phut sau logout
15	File type khong validate	file.controller.ts:40-44	Khong co fileFilter. Upload duoc .exe, .sh, .bat
MEDIUM
#	Lo hong	File	Van de
16	Khong co CSRF protection	frontend/src/lib/api.ts	Chi dua vao SameSite cookie, khong co CSRF token
17	sameSite='none' in production	auth.controller.ts:30-45	Nen dung 'strict' hoac 'lax' neu co the
18	Khong log failed login	auth.service.ts:143-168	Khong the detect brute force attacks
19	Khong log password changes	user.service.ts:102-119	Khong co audit trail
III. LOI NGHIEP VU (Business Logic Bugs)
CRITICAL
#	Loi	File	Van de
1	Invoice - Khong validate status transition	invoice.service.ts:122-140	Co the chuyen PAID -> DRAFT, CANCELLED -> SENT. Hoa don da thanh toan co the bi revert
2	Task - Assign cho nguoi ngoai project	task.service.ts:69-94	accepteeId khong duoc validate la thanh vien cua project
HIGH
#	Loi	File	Van de
3	Tax calculation rounding	invoice.service.ts:86	Math.round(subtotal * rate) / 100 dung float thay vi Decimal. Sai so khi tinh thue VND/USD
4	Project - Khong validate status transition	project.service.ts:176-188	Co the chuyen COMPLETED -> PLANNING. Du an hoan thanh co the bi revert
5	Task circular subtasks	task.service.ts	Khong check parentId !== taskId. Task co the la cha cua chinh no
MEDIUM
#	Loi	File	Van de
6	Negative time entries	prisma/schema.prisma	hours Float khong validate > 0. Gio am giam tong project
7	AI - Khong co quota per user	ai.service.ts	User spam AI calls khong gioi han -> hoa don Anthropic tang vot
8	AI cost precision	ai.service.ts:71-76	estimateCostUsd dung floating point thay vi Decimal
9	Notification duplication	notification.service.ts:47-65	Khong dedup. Thay doi task status nhieu lan -> spam notification
10	Push subscription leak	push.service.ts:53-91	Subscription fail (khong phai 404/410) khong bi xoa, tiep tuc fail
IV. TONG HOP DIEM SO
Khia canh	Diem	Nhan xet
Backend Structure	7/10	Module tot, thieu Repository + Envelope + Versioning
Frontend Structure	5.4/10	Thieu RSC, Error Boundaries, nhieu component qua lon
Bao mat	4/10	8 IDOR criticals, brute force, account overwrite
Business Logic	5/10	Thieu state machine cho Invoice/Project/Task status
Type Safety	7.5/10	Tot, it as any, nhung backend thieu Repository types
Test Coverage	3/10	Chi co unit test service, thieu integration + e2e
TONG	5.3/10	Chua dat chuan Enterprise. Can fix bao mat truoc
V. THU TU UU TIEN FIX
Dot 1 - Bao mat (Khẩn cấp)
Fix 8 IDOR vulnerabilities (thêm authorization checks)
Add rate limiting cho login/register/verify-email
Fix account overwrite vulnerability
Add file type validation (whitelist MIME types)
Fix weak change-password DTO
Dot 2 - Business Logic (Sprint nay)
Implement Invoice status state machine
Implement Project status state machine
Validate task assignee is project member
Fix tax calculation dung Decimal
Add AI usage quotas per user
Dot 3 - Architecture (Sprint tiep)
Add Global Exception Filter + Response Interceptor (envelope pattern)
Add API versioning /api/v1/
Add Error Boundaries + loading.tsx cho frontend
Split oversized components
Convert landing pages sang Server Components
Dot 4 - Quality (Backlog)
Add Repository layer
Consolidate duplicate Sidebar/Header
Replace <img> voi Next.js Image
Add integration tests + e2e tests
Add audit logging (login failures, password changes)