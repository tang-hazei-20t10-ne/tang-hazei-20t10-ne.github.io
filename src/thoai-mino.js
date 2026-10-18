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
    { from: 'partner', text: 'Hi Hazei' },
    { from: 'partner', text: 'Cậu coá đang rảnh hông' },
    { replies: ['Rảnh á', 'Đang nằm chill nè'] },
    { from: 'partner', text: 'nay 20/10, tớ có làm cái này cho cậu 😆' },
    { from: 'partner', text: 'Cậu vào link discord này nha' },
    { replies: ['Hả, gì vậy 👀', 'Nghe hay á'] },
    { from: 'partner', text: 'Vô đi là biết á' },
    { from: 'partner', invite: true },
  ],

  // ---------------------------------------------------------- Chương 1: Đồng cỏ
  dongCo: {
    moDau: 'Đồng hoa vào sáng sớm đẹp ghê.',
    boaDauTien: 'Bông đó xinh nè.', // khi Hazei hái bông hoa đầu tiên
    khenHoa: ['Đẹp ha', 'Thêm một bông 🌼', 'Yayy'], // thỉnh thoảng nói khi hái hoa
    choMochi: 'Con này đòi đi theo mình luôn nè.',
    ghe: 'Ngồi nghỉ chút nhe.',
    ga: ['Cục ta cục tác!', 'Mấy con gà dậy sớm dữ'],
    coiXayGio: 'Cối xay gió gì quay chậm rì.',
    buom: 'Bướm đậu lên tay cậu kìa!',
    hoiChupHinh: 'Cậu muốn chụp hình ở đây không, tớ chụp cho?',
    chupHinhSanSang: 'Rồi, cười lên nè… 1, 2, 3!',
    khongChup: 'Oke!',
    ruDiTiep: 'Mình đi hội chợ ha',
  },

  // ---------------------------------------------------------- Chương 2: Chợ
  cho: {
    moDau: 'Tới hội chợ rồi. Cuối dãy có photobooth á, lát ghé xem thử ha.',
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
    moDau: 'Tiệm sách này có một bé mèo xinh yêu lắm á 😴',
    goiY: ['Cuốn “Thư gửi chính mình” hay lắm đó.', 'Đĩa “Đèn đường” nghe cuốn ghê.'],
    meo: 'Nó kêu rừ rừ thì phải :)))',
    ruDiTiep: 'Cậu đói chưa, mình đi ăn nha.',
  },

  // ---------------------------------------------------------- Chương 5: Omakase
  omakase: {
    camOnBac: 'Cảm ơn bác ạ!',
  },

  // ---------------------------------------------------------- Chương 6: Cà phê
  caPhe: {
    moDau: 'Cậu chọn nước đi.',
    // {nuoc} sẽ được thay bằng tên nước Hazei đã chọn
    goiNuoc: 'Cho tớ một cà phê muối, với một {nuoc} cho bạn này nha!',
    ngoiChill: 'Ngồi đây nhìn ra cửa sổ thấy chill ghê. Uống nước xong mình sẽ ra biển á.',
  },

  // ---------------------------------------------------------- Chương 7: Biển
  bien: {
    moDau: 'Biển nè! Cậu thử viết tên lên cát coi.',
    ghe: 'Ngồi nghe sóng vỗ từng lớp xa',
    cua: 'Có bạn cua kìa 🦀',
    thaDen: 'Bay lên rùi hehe!',
    ruDiTiep: 'Giờ mình ra núi sau trường ngắm hoàng hôn ha!',
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
  // Lời chúc = mởĐầu + ý chúc từ donut + 5 ý chúc từ omakase + ý chúc từ ly nước + kếtThúc
  //           + "Chúc mừng ngày Phụ nữ Việt Nam 20/10!"
  loiChuc: {
    moDau: 'Đây là những lời chúc cậu có qua những lựa chọn xuyên suốt hành trình',
    ketThuc: 'Cảm ơn cậu đã đi chơi với tớ nha.',
  },

  // ---------------------------------------------------------- Kết: Discord
  cuoiNgay: {
    tinNhan: ['hết chuyến đi rồi đó 😆', 'gửi lại mấy tấm ảnh với kỷ niệm hôm nay nè'],
    loiChao: '20/10 vui vẻ nha 🌷', // tin nhắn cuối cùng
  },
};
