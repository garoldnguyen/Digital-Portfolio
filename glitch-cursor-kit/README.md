# Glitch cursor

Mở `demo.html` để thử bằng chuột hoặc cảm ứng. Để gắn vào portfolio, đặt file JavaScript cạnh trang HTML rồi thêm đoạn sau ngay trước thẻ đóng body.

```html
<script src="./glitch-cursor.js"></script>
<script>
  const removeGlitchCursor = installGlitchCursor(document.body)
</script>
```

Truyền phần tử riêng vào hàm nếu chỉ muốn bật hiệu ứng trong một vùng. Gọi `removeGlitchCursor()` khi gỡ component. Đánh dấu vùng cần con trỏ mặc định bằng `data-native-cursor`. Chế độ giảm chuyển động giữ con trỏ tĩnh. Bộ PNG ở kích thước gốc có thể dùng riêng trong pipeline pixel art.

## Giao diện sáng và tối

Cursor nhận `data-theme="light|dark"`, `data-bs-theme` hoặc lớp `light`, `dark`, `theme-light`, `theme-dark` trên phần tử và các phần tử cha. Nếu portfolio dùng cơ chế khác, đặt `data-cursor-theme="light"` hoặc `"dark"` lên phần tử đã gắn cursor trong hàm đổi theme. Khi không có theme tường minh, cursor dùng tùy chọn sáng/tối của thiết bị.

PNG theme sáng ở `assets/pixel/`. Bản tối ở `assets/pixel/dark/` với cùng tên file. Demo có nút thử cả hai bảng màu.
