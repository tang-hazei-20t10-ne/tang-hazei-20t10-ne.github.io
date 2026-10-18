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
    { from: 'partner', text: 'nay 20/10, tớ có làm cái này bất ngờ cho cậu 😆' },
    { from: 'partner', text: 'Cậu vào link discord này nha' },
    { replies: ['Hả, gì vậy 👀', 'có bất ngờ ko í =))'] },
    { from: 'partner', text: 'Tớ gửi nhó' },
    { from: 'partner', invite: true },
  ],

  // ---------------------------------------------------------- Chương 1: Đồng cỏ
  dongCo: {
    moDau: 'Đồng hoa sáng sớm đẹp ghê ha.',
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
    ruDiTiep: 'Mình qua hội chợ bên kia ha',
  },

  // ---------------------------------------------------------- Chương 2: Chợ
  cho: {
    moDau: 'Tới hội chợ rồi. Cuối dãy có photobooth á, lát ghé xem thử ha.',
    khenMu: 'Hợp phết!',
    khenKinh: 'Ngầu đó 😎',
    boCau: 'Woww bồ câu bay kìa!',
    ruDiTiep: 'Ra ga thôi, tàu sắp chạy rồi.',
  },

  // ---------------------------------------------------------- Chương 3: Tàu
  tau: {
    moDau: 'Ngồi ngắm cảnh chíu là tới à hehe',
    sapToiGa: 'Sắp tới ga rồi. Gần ga có tiệm sách cũ xinh lắm á.',
  },

  // ---------------------------------------------------------- Chương 4: Tiệm sách
  tiemSach: {
    moDau: 'Tiệm sách này có một bé mèo xinh yêu lắm á 😴',
    goiY: ['Cuốn “Hoàng tử bé” hay lắm đó.', 'Đĩa “Đèn đường” nghe cuốn ghê.'],
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
    moDau: 'Nghe nói mọi người hay ra đây viết tên mình lên cát á',
    ghe: 'Ngồi nghe sóng vỗ từng lớp xa',
    cua: 'Có bạn cua kìa 🦀',
    thaDen: 'Bay lên rùi hehe!',
    ruDiTiep: 'Cậu có thể ra ngọn núi sau trường thăm quan thử á!',
    tamBiet: 'Tớ phải về nhà một chút. Cần gì thì tớ vẫn trong voice nha 💬',
  },

  // ---------------------------------------------------------- Chương 8–11: tin nhắn Discord nhỏ ở góc màn hình
  tinNhanVoice: {
    island_arrive: 'Cậu lên núi chưa? giờ này nắng đẹp nhất đó 🌅', // vừa lên núi
    island_flower: 'Cậu thử hái hoa trên đó rùi hả', // hái hoa đầu tiên trên núi
    island_cat: 'con mèo đó ngủ ngon ghê', // vuốt mèo
    island_lighthouse: 'Quanh đó có 1 cái chòi để cậu leo lên á', // tới gần chòi
    island_swing: 'Coi chừng ngã nha :)))', // ngồi xích đu
    island_boat: 'Biết chèo thuyền lun ta', // chèo thuyền
    island_balloon: 'Nếu cậu thấy khinh khí cầu thì nhất định phải thử á ✨', // khinh khí cầu sẵn sàng
    balloon_start: 'Nhìn từ trên cao thích ha',
    balloon_village: 'Thành phố lên đèn rồi!!!',
    balloon_land: 'Cậu đáp rồi hả',
    hill_arrive: 'Tầm này nhìn lên bầu trời đẹp lắm á',
    hill_star: 'Thấy sao băng là phải ước lẹ đó ⭐',
    village_arrive: 'Cậu chơi một chút ở lễ hội đi nha',
    village_stage: 'Tớ ở cuối đường',
  },

  // ---------------------------------------------------------- Chương 12: Sân khấu
  sanKhau: {
    tangHoa: 'Hát hay quá dợ :))), hoa này là tớ hái trong lúc mình đi luôn á',
    themHoa: 'Vẫn còn thơm ha', // chỉ nói khi Hazei hái ít hoa
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
    tinNhan: ['hết chuyến đi rồi đó 😆', 'Đây là những kỷ niệm của ngày hôm nay nè'],
    loiChao: '20/10 vui vẻ nha 🌷', // tin nhắn cuối cùng
  },
};
