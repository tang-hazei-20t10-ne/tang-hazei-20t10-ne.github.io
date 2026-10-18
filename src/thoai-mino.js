// =====================================================================
//  THOẠI CỦA MINO
//  Mọi câu Mino nói trong game nằm ở đây, xếp theo thứ tự xuất hiện.
//
//  Cách sửa:
//   - Chỉ sửa chữ bên trong dấu nháy '...'. Giữ nguyên dấu phẩy và ngoặc.
//   - Muốn dùng dấu nháy đơn trong câu thì viết \' (vd. 'it\'s').
//   - Danh sách [ ... ]: thêm/bớt câu thoải mái, mỗi câu cách nhau dấu phẩy.
//   - Lưu file là game tự tải lại (khi đang chạy npm run dev).
// =====================================================================

export default {
  // ---------------------------------------------------------- Mở đầu: Discord
  // Đoạn chat Discord. { from: 'partner', text } là tin của Mino;
  // { replies: [...] } là chỗ Hazei chọn câu trả lời nhanh;
  // { from: 'partner', invite: true } là thẻ mời vào kênh thoại (giữ ở cuối).
  discordChat: [
    { from: 'partner', text: 'ê Hazei' },
    { from: 'partner', text: 'rảnh hông' },
    { replies: ['Rảnh nè, sao á?', 'Đang nằm chill nè'] },
    { from: 'partner', text: 'nay 20/10, tớ có làm cái này cho cậu 😆' },
    { from: 'partner', text: 'một chuyến đi chơi nho nhỏ, chơi trong discord luôn' },
    { replies: ['Hả, gì vậy 👀', 'Nghe hay á'] },
    { from: 'partner', text: 'vô voice đi rồi biết' },
    { from: 'partner', invite: true },
  ],

  // ---------------------------------------------------------- Chương 1: Đồng cỏ
  dongCo: {
    moDau: 'Sáng sớm đẹp ghê. Thấy hoa nào xinh thì cậu hái nha, lát có việc dùng tới đó.',
    boaDauTien: 'Bông đó xinh nè.', // khi Hazei hái bông hoa đầu tiên
    khenHoa: ['Đẹp đó!', 'Thêm một bông 🌼', 'Ổn áp'], // thỉnh thoảng nói khi hái hoa
    choMochi: 'Bé Mochi chịu cậu rồi đó, đòi đi theo luôn.',
    ghe: 'Ngồi nghỉ chút nè.',
    ga: ['Cục ta cục tác!', 'Mấy bé gà dậy sớm hơn tụi mình luôn'],
    coiXayGio: 'Cối xay gió quay chậm rì.',
    buom: 'Bướm đậu lên tay cậu kìa!',
    hoiChupHinh: 'Cậu muốn chụp hình ở đây không, tớ chụp cho?',
    chupHinhSanSang: 'Rồi, cười lên nè… 1, 2, 3!',
    khongChup: 'Oke!',
    ruDiTiep: 'Ra chợ không? Chợ sáng vui lắm.',
  },

  // ---------------------------------------------------------- Chương 2: Chợ
  cho: {
    moDau: 'Tới chợ rồi. Cuối dãy có tiệm chụp hình, lát ghé chụp một dải nha.',
    khenMu: 'Hợp phết!',
    khenKinh: 'Ngầu đó 😎',
    boCau: 'Bồ câu bay hết rồi kìa!',
    ruDiTiep: 'Ra ga thôi, tàu sắp chạy rồi.',
  },

  // ---------------------------------------------------------- Chương 3: Tàu
  tau: {
    moDau: 'Giờ thì ngồi ngắm cảnh thôi.',
    sapToiGa: 'Sắp tới ga rồi. Gần ga có tiệm sách cũ xinh lắm.',
  },

  // ---------------------------------------------------------- Chương 4: Tiệm sách
  tiemSach: {
    moDau: 'Tiệm sách này có cả góc đĩa than nữa. Đừng đánh thức bé mèo nha 😴',
    goiY: ['Cuốn “Thư gửi chính mình” hay lắm đó.', 'Đĩa “Đèn đường” nghe cuốn ghê.'],
    meo: 'Bé mèo kêu rừ rừ kìa…',
    ruDiTiep: 'Đói chưa? Đi ăn trưa thôi.',
  },

  // ---------------------------------------------------------- Chương 5: Omakase
  omakase: {
    camOnBac: 'Cảm ơn bác, ngon thật sự!',
  },

  // ---------------------------------------------------------- Chương 6: Cà phê
  caPhe: {
    moDau: 'Chọn nước đi, bữa nay tớ bao 😎',
    goiNuoc: 'Cho tớ một Caramel Macchiato nha!',
    ngoiChill: 'Ngồi đây nhìn ra cửa sổ thấy chill ghê. Chiều mình ra biển nha.',
  },

  // ---------------------------------------------------------- Chương 7: Biển
  bien: {
    moDau: 'Biển nè! Cậu thử viết tên lên cát coi.',
    ghe: 'Ngồi nghe sóng chút nha.',
    cua: 'Có bạn cua kìa 🦀',
    thaDen: 'Bay lên rồi kìa!',
    ruDiTiep: 'Lát lên núi sau trường ngắm hoàng hôn không?',
    tamBiet: 'Tớ phải về nhà một chút, cậu lên núi trước nha. Tớ vẫn ở trong voice đó 💬',
  },

  // ---------------------------------------------------------- Chương 8–11: tin nhắn Discord nhỏ ở góc màn hình
  tinNhanVoice: {
    island_arrive: 'lên núi chưa? giờ này nắng đẹp nhất đó 🌅', // vừa lên núi
    island_flower: 'hái thêm vài bông nha, lát có việc dùng 😌', // hái hoa đầu tiên trên núi
    island_cat: 'con mèo đó ngủ ngon ghê', // vuốt mèo
    island_lighthouse: 'leo lên chòi ngắm cảnh thử đi, view đỉnh lắm', // tới gần chòi
    island_swing: 'đu nhẹ thôi nha 😆', // ngồi xích đu
    island_boat: 'chèo thuyền giỏi ghê ta', // chèo thuyền
    island_balloon: 'thấy khinh khí cầu chưa? lên thử đi ✨', // khinh khí cầu sẵn sàng
    balloon_start: 'bay rồi!! nhìn xuống thành phố coi',
    balloon_village: 'thành phố lên đèn rồi kìa',
    balloon_land: 'đáp rồi hả. đợi trời tối chút nha',
    hill_arrive: 'nằm xuống ngắm trời thử đi, sắp có sao rồi',
    hill_star: 'thấy sao băng chưa? ước lẹ lên ⭐',
    village_arrive: 'tới lễ hội rồi! chơi hết mấy trò đi',
    village_stage: 'đi tới cuối phố đi, có bất ngờ đó',
  },

  // ---------------------------------------------------------- Chương 12: Sân khấu
  sanKhau: {
    tangHoa: 'Hát hay quá trời! Bó hoa này làm từ mấy bông cậu hái hôm nay đó, tớ chỉ gói lại thôi.',
    themHoa: 'Tớ thêm vài bông cho đầy đặn nha.', // chỉ nói khi Hazei hái ít hoa
  },

  // ---------------------------------------------------------- Lời chúc
  // Lời chúc = mởĐầu + 5 ý chúc từ bữa omakase + kếtThúc + "Chúc mừng ngày Phụ nữ Việt Nam 20/10!"
  loiChuc: {
    moDau: 'Hazei ơi, tớ chúc cậu…',
    ketThuc: 'Cảm ơn cậu đã là một người bạn tuyệt vời.',
  },

  // ---------------------------------------------------------- Kết: Discord
  cuoiNgay: {
    tinNhan: ['hết chuyến đi rồi đó 😆', 'tớ gửi lại mấy tấm ảnh với kỷ niệm hôm nay nè'],
    loiChao: '20/10 vui vẻ nha 🌷', // tin nhắn cuối cùng
  },
};
