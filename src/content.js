// =====================================================================
//  HAZEI'S JOURNEY · CONTENT FILE
//  Every word the player sees lives here. Edit freely (keep UTF-8).
//  Anything marked TODO is a placeholder the creator should replace.
//  Thoại của Mino nằm riêng ở src/thoai-mino.js.
// =====================================================================
import M from './thoai-mino.js';

export default {
  playerName: 'Hazei',
  partnerName: 'Mino', // tên hiện trong hội thoại

  // Partner look (chỉnh cho giống Mino). Colors are CSS hex.
  partnerLook: {
    hair: '#3b2a25',
    hairStyle: 'short', // 'short' | 'messy' | 'long'
    glasses: true,
    skin: '#f6cfb0',
    top: '#7f9fdc', // áo hoodie
    topAccent: '#f4f1ea',
    bottom: '#3f4466',
    shoes: '#f1ece3',
  },
  hazeiLook: {
    hair: '#251822',
    skin: '#ffdcc4',
    top: '#fff4e6',
    dress: '#f2a7ba',
    shoes: '#8a4b5a',
  },

  // Discord avatars: put a square image path (e.g. 'assets/hazei.png') or
  // leave null to use the generated pixel avatars.
  avatars: { hazei: null, partner: null },

  discord: {
    serverName: 'Hội Chill 🌿', // TODO
    serverInitials: 'HC',
    partnerHandle: 'mino', // tên Discord của Mino
    hazeiHandle: 'hazei',
    textChannels: ['chung', 'ảnh-đẹp', 'nhạc-hay', 'kèo-đi-chơi'],
    voiceChannel: 'Chill cùng nhau',
    activityName: "Hazei's Journey",
    activityDesc: 'Một ngày đi chơi nho nhỏ, từ sáng sớm tới tối.',
    startButton: 'Bắt đầu chuyến hành trình',
    joinVoice: 'Tham gia kênh thoại',
    typing: 'đang soạn tin…',
    messagePlaceholder: 'Nhắn tin cho @',
    continueHint: 'Chạm để tiếp tục',
    voiceConnected: 'Đã kết nối thoại',
    inVoice: 'Đang trong kênh thoại',
    today: 'Hôm nay lúc',
    friends: 'Bạn bè',
    dmLabel: 'Tin nhắn trực tiếp',
    online: 'Trực tuyến',
    activitiesTitle: 'Hoạt động',
    activitiesHint: 'Chọn một hoạt động để chơi cùng nhau',
    activityPlayers: '2 người đang tham gia',
    // Each item: { from: 'partner' | 'hazei', text } or { replies: [...] }
    // A replies item pauses for Hazei to tap a quick reply (or "tiếp").
    dm: M.discordChat, // thoại: src/thoai-mino.js
  },

  ui: {
    loading: 'Đang chuẩn bị chuyến đi…',
    loadingHints: [
      'Đang gói ghém nắng sớm…',
      'Đang tưới mấy luống hoa…',
      'Đang lau kính tàu hỏa…',
      'Đang treo đèn lồng…',
    ],
    errorTitle: 'Ôi, có chút trục trặc rồi',
    errorBody: 'Cậu thử tải lại trang giúp tớ nha. Tiến trình đã được lưu lại rồi.',
    reload: 'Tải lại',
    webglError: 'Trình duyệt này chưa hỗ trợ phần 3D. Cậu thử mở bằng Chrome hoặc Safari mới hơn nha.',
    resumeTitle: 'Mừng cậu quay lại',
    resume: 'Đi tiếp từ chỗ cũ',
    restart: 'Bắt đầu lại từ đầu',
    restartConfirm: 'Bắt đầu lại sẽ xoá hoa đã hái và ảnh đã chụp. Cậu chắc chứ?',
    yes: 'Ừ, bắt đầu lại',
    no: 'Thôi, đi tiếp',
    tapToStart: 'Chạm để bắt đầu',
    tapToContinue: 'Chạm để tiếp tục',
    next: 'Tiếp',
    close: 'Đóng',
    back: 'Quay lại',
    hold: 'Giữ',
    press: 'Nhấn',
    mute: 'Tắt tiếng',
    unmute: 'Bật tiếng',
    volume: 'Âm lượng',
    settings: 'Cài đặt',
    album: 'Album',
    albumEmpty: 'Chưa có tấm ảnh nào. Mình đi chụp thêm nha!',
    download: 'Tải về',
    flowersCount: 'bông hoa',
    rotateHint: 'Xoay ngang điện thoại để ngắm rõ hơn nha',
    paused: 'Tạm dừng',
    controls2D: '← → hoặc A D để đi · giữ E hoặc Space để tương tác',
    controls2DTouch: 'Dùng nút mũi tên để đi · giữ nút tim để tương tác',
    controls3D: 'W A S D để đi · kéo chuột để nhìn · giữ E để tương tác',
    controls3DTouch: 'Cần gạt trái để đi · vuốt màn hình để nhìn · giữ nút tim để tương tác',
    chapterWord: 'Chương',
    goOn: 'Đi tiếp',
    stay: 'Ở lại thêm chút',
    photo: 'Chụp ảnh',
    photoSaved: 'Đã cất ảnh vào album 📷',
    photoCaptionDefault: 'Một ngày đẹp trời',
    tapToPlay: 'Chạm để bắt đầu bài hát',
    songMissing: 'Chưa có file bài hát, tớ mở tạm một giai điệu nha',
    debugTitle: 'Gỡ lỗi',
  },

  prompts: {
    pick: 'Hái hoa',
    pet: 'Vuốt ve',
    sit: 'Ngồi nghỉ',
    stand: 'Đứng dậy',
    talk: 'Trò chuyện',
    next: 'Đi tiếp',
    look: 'Ngắm',
    read: 'Đọc thử',
    taste: 'Nếm thử',
    smell: 'Ngửi hoa',
    tryOn: 'Thử đồ',
    takeOff: 'Tháo ra',
    booth: 'Vào chụp hình',
    feed: 'Cho ăn',
    play: 'Nghe thử',
    bookmark: 'Lấy kẹp sách',
    write: 'Viết tên',
    lantern: 'Thả đèn trời',
    shell: 'Nhặt vỏ sò',
    photo: 'Chụp ảnh',
    swing: 'Ngồi xích đu',
    lie: 'Nằm ngắm trời',
    telescope: 'Nhìn ống nhòm',
    climb: 'Leo lên',
    descend: 'Đi xuống',
    boat: 'Chèo thuyền',
    blanket: 'Ngồi picnic',
    balloon: 'Lên khinh khí cầu',
    ring: 'Ném vòng',
    fish: 'Vớt cá vàng',
    paint: 'Vẽ đèn lồng',
    fireworks: 'Bắn pháo hoa',
    stage: 'Bước lên sân khấu',
    puddle: 'Nhảy vũng nước',
    bell: 'Rung chuông',
    wave: 'Vẫy tay',
  },


  chapters: [
    { id: 'discord', title: 'Mở đầu', time: '' },
    { id: 'meadow', title: 'Bình minh trên đồng cỏ', time: 'Bình minh' },
    { id: 'market', title: 'Hội chợ & tiệm chụp hình', time: 'Buổi sáng' },
    { id: 'train', title: 'Chuyến tàu đến địa điểm tổ chức lễ hội', time: 'Gần trưa' },
    { id: 'bookshop', title: 'Tiệm sách cũ & góc đĩa than', time: 'Gần trưa' },
    { id: 'omakase', title: 'Bữa trưa omakase', time: 'Giữa trưa' },
    { id: 'cafe', title: 'Một góc cà phê', time: 'Đầu giờ chiều' },
    { id: 'seaside', title: 'Chiều bên biển', time: 'Chiều muộn' },
    { id: 'island', title: 'Núi sau trường', time: 'Giờ vàng' },
    { id: 'balloon', title: 'Khinh khí cầu trong ráng chiều', time: 'Hoàng hôn' },
    { id: 'hill', title: 'Đỉnh núi ngắm sao', time: 'Chạng vạng' },
    { id: 'village', title: 'Lễ hội đèn lồng', time: 'Đêm' },
    { id: 'stage', title: 'Sân khấu của Hazei', time: 'Đêm' },
    { id: 'epilogue', title: 'Lời nhắn cuối ngày', time: '' },
  ],

  // ---------------------------------------------------------------- 2D
  meadow: {
    intro: [
      { who: 'partner', text: M.dongCo.moDau },
    ],
    firstFlower: M.dongCo.boaDauTien,
    flowerReacts: M.dongCo.khenHoa,
    dog: M.dongCo.choMochi,
    dogName: 'Mochi',
    bench: M.dongCo.ghe,
    benchSit: 'Gió sớm mát ghê…',
    chickens: M.dongCo.ga,
    windmill: M.dongCo.coiXayGio,
    butterfly: M.dongCo.buom,
    exitHint: M.dongCo.ruDiTiep,
    exitSign: 'Hội chợ →',
    // Mino offers to take a photo at the sunrise spot
    photoAsk: M.dongCo.hoiChupHinh,
    photoChoices: ['Okela!', 'Chụp phải đẹp đó nha'],
    photoReady: M.dongCo.chupHinhSanSang,
    photoNo: M.dongCo.khongChup,
    photoCaption: 'Bình minh trên đồng cỏ',
  },

  market: {
    intro: [
      { who: 'partner', text: M.cho.moDau },
    ],
    snack: {
      vendor: 'Cô bán bánh',
      lines: ['Donut mới ra lò nè con, chọn một cái ăn thử đi!', 'Ngon hông? Ăn sáng là phải vui vậy đó.'],
      react: 'Mềm xốp, ngon quá trời!',
      title: 'Tiệm donut',
      choose: 'Chọn một chiếc donut nha',
      sweet: 'Ngọt', savory: 'Mặn',
      // Each donut adds one line to the final wish.
      donuts: [
        { id: 'choco', name: 'Donut sô-cô-la', desc: 'Phủ sô-cô-la, rắc cốm bảy màu.', kind: 'sweet', glaze: '#6a3a2a', sprinkles: true, react: 'Ngọt lịm, vui cả buổi sáng!', fragment: 'ngày nào cũng có một chút ngọt ngào để mong chờ' },
        { id: 'strawberry', name: 'Donut dâu hồng', desc: 'Lớp kem dâu hồng hồng, thơm nhẹ.', kind: 'sweet', glaze: '#f59ac0', sprinkles: false, react: 'Hồng hồng dễ thương y như vị!', fragment: 'luôn được bao quanh bởi những điều dễ thương' },
        { id: 'floss', name: 'Donut chà bông', desc: 'Sốt mayo, chà bông và hành lá.', kind: 'savory', glaze: '#e8c070', sprinkles: false, react: 'Mặn mặn béo béo, ghiền rồi!', fragment: 'luôn đủ đầy, không bao giờ thiếu một bữa ngon' },
        { id: 'cheese', name: 'Donut phô mai gà cay', desc: 'Nhân gà cay, phủ phô mai kéo sợi.', kind: 'savory', glaze: '#ffd860', sprinkles: false, react: 'Cay cay, phô mai kéo sợi luôn!', fragment: 'có đủ lửa nhiệt huyết cho mọi điều mình thích' },
      ],
    },
    flowers: {
      vendor: 'Chị bán hoa',
      lines: ['Hoa sáng nay mới về, em ngửi thử đi.', 'Chị tặng bé một bông nè.'],
      react: 'Thơm dịu dịu.',
    },
    hats: {
      vendor: 'Anh bán mũ',
      lines: ['Thử cái mũ cói này đi em, hợp lắm.', 'Hay kính râm cho ngầu?'],
      items: ['Mũ cói', 'Kính râm', 'Tháo ra'],
      reactHat: M.cho.khenMu,
      reactGlasses: M.cho.khenKinh,
    },
    fruit: {
      vendor: 'Bác bán trái cây',
      lines: ['Chào hai đứa! Hôm nay xoài ngọt lắm nha.', 'Đi chơi vui vẻ nghen.'],
    },
    kids: { lines: ['Chị ơi chị xinh quá!', 'Chơi đuổi bắt hông chị?'] },
    pigeons: M.cho.boCau,
    booth: {
      title: 'Tiệm Chụp Hình Tí Hon',
      intro: 'Chụp bốn tấm nha! Mỗi tấm chọn phông nền và kiểu tạo dáng.',
      frame: 'Tấm',
      chooseBackdrop: 'Chọn phông nền',
      choosePose: 'Chọn kiểu tạo dáng',
      backdrops: ['Vườn hoa', 'Biển xanh', 'Trời sao', 'Kẹo ngọt'],
      poses: ['Hai ngón tay ✌', 'Mặt ngố', 'Đập tay', 'Khoác vai', 'Nhảy lên', 'Kính râm ngầu'],
      countdown: ['3', '2', '1', 'Tách!'],
      done: 'Dải ảnh xịn ghê! Tớ cất vào album rồi nha.',
      stripTitle: 'Hazei & Mino',
      download: 'Tải dải ảnh',
      continue: 'Đi tiếp',
    },
    exitHint: M.cho.ruDiTiep,
    exitSign: 'Ga tàu →',
  },

  train: {
    intro: [
      { who: 'partner', text: M.tau.moDau },
    ],
    // Real footage shown in the train window. Put a video in public/assets/
    // (mp4 or webm). If the file is missing, a pixel-art landscape is shown.
    video: 'assets/train-window.mp4',
    videoCredit: 'Video: Nikita Yang · CC BY-SA 4.0 · Wikimedia Commons',
    sights: {
      terraces: 'Ruộng bậc thang vàng óng…',
      lake: 'Mặt hồ phẳng như gương.',
      tunnel: 'Đường hầm có trần lấp lánh như sao!',
      town: 'Một thị trấn nhỏ trên đồi.',
      kids: 'Mấy bé đang vẫy tay kìa!',
      balloons: 'Xa xa có khinh khí cầu…',
    },
    arrive: M.tau.sapToiGa,
    arriveButton: 'Xuống tàu',
  },

  bookshop: {
    intro: [
      { who: 'partner', text: M.tiemSach.moDau },
    ],
    // Original lines written for this game.
    // Real books with short quotes (one per shelf). Translations are ours.
    books: [
      { title: 'Anne tóc đỏ dưới chái nhà xanh', author: 'L.M. Montgomery', line: '“Nghĩ tới việc ngày mai là một ngày mới, chưa có lỗi lầm nào, chẳng phải dễ chịu lắm sao?”' },
      { title: 'Nhà giả kim', author: 'Paulo Coelho', line: '“Khi bạn thật lòng mong muốn điều gì, cả vũ trụ sẽ hợp lực giúp bạn đạt được điều đó.”' },
      { title: 'Alice ở xứ sở thần tiên', author: 'Lewis Carroll', line: '“Tôi không thể quay về ngày hôm qua, vì khi ấy tôi đã là một người khác rồi.”' },
      { title: 'Những cô gái nhỏ', author: 'Louisa May Alcott', line: '“Em không sợ giông bão, vì em đang học cách lái con thuyền của mình.”' },
      { title: 'Hoàng tử bé', author: 'Antoine de Saint-Exupéry', line: '“Chính thời gian cậu dành cho bông hồng của cậu đã khiến bông hồng ấy trở nên quan trọng đến thế.”' },
    ],
    records: [
      { title: 'Chiều phố cũ', style: 'jazz' },
      { title: 'Mưa trên mái ngói', style: 'lofi' },
      { title: 'Vũ điệu tách trà', style: 'waltz' },
      { title: 'Đèn đường', style: 'bossa' },
    ],
    recordsTitle: 'Chọn một đĩa than',
    partnerRecs: M.tiemSach.goiY,
    cat: M.tiemSach.meo,
    bookmark: {
      name: 'Kẹp sách hoa ép',
      desc: 'Một chiếc kẹp sách có ép bông cúc nhỏ, quà của cô chủ tiệm.',
      line: 'Cô chủ tiệm nói: “Tặng cháu nè, giữ làm kỷ niệm nha.”',
    },
    exitHint: M.tiemSach.ruDiTiep,
    exitSign: 'Đi ăn trưa →',
  },

  omakase: {
    chefName: 'Bác đầu bếp',
    intro: [
      { who: 'chef', text: 'Chào hai cháu! Hôm nay có năm lượt món, mỗi lượt hai món, cháu chọn món nào cũng được.' },
      { who: 'chef', text: 'Món nào cũng mang một lời chúc riêng đó.' },
    ],
    choose: 'Chọn món nào ta?',
    roundWord: 'Lượt',
    fragmentNote: 'Một mảnh lời chúc đã được cất đi ✨',
    outro: [
      { who: 'chef', text: 'Năm lời chúc nhỏ, bác gói lại cho cháu rồi. Tối nay cháu sẽ thấy.' },
      { who: 'partner', text: M.omakase.camOnBac },
    ],
    rounds: [
      {
        name: 'Khai vị',
        options: [
          {
            dish: 'Trứng hấp chawanmushi',
            short: 'Mềm như một buổi sáng không vội vã.',
            chef: 'Trứng phải hấp lửa thật nhỏ, không được vội, thì mặt mới mịn như vầy. Bác mong ngày nào của cháu cũng có lúc chậm lại như vậy, để được thở và thương chính mình.',
            fragment: 'luôn có những khoảng bình yên cho riêng mình',
            sprite: 'chawanmushi',
          },
          {
            dish: 'Đậu hũ lạnh với hoa ăn được',
            short: 'Thanh mát và nở hoa ngay trên đĩa.',
            chef: 'Đậu hũ giản dị thôi, mà rắc chút hoa lên là thành một khu vườn nhỏ. Cháu cũng vậy đó, đi tới đâu là ở đó có hoa nở.',
            fragment: 'ở đâu cũng nở được một mùa hoa của riêng mình',
            sprite: 'tofu',
          },
        ],
      },
      {
        name: 'Sashimi',
        options: [
          {
            dish: 'Cá cam hamachi',
            short: 'Món của những khởi đầu mới.',
            chef: 'Người Nhật hay ăn cá cam vào dịp năm mới, vì nó là cá của khởi đầu. Bác chúc cháu sáng nào thức dậy cũng thấy háo hức với một điều gì đó.',
            fragment: 'mỗi ngày đều bắt đầu bằng một điều háo hức',
            sprite: 'hamachi',
          },
          {
            dish: 'Cá ngừ béo otoro',
            short: 'Hiếm và béo ngậy, dành cho lúc muốn trân trọng.',
            chef: 'Otoro là phần quý nhất của con cá, bác chỉ mời khách đặc biệt thôi. Cháu xứng đáng được đối xử nâng niu như vậy, ở bất cứ đâu.',
            fragment: 'luôn được đối đãi bằng sự trân trọng',
            sprite: 'otoro',
          },
        ],
      },
      {
        name: 'Nigiri',
        options: [
          {
            dish: 'Sò điệp hotate',
            short: 'Ngọt hậu, như những niềm vui nhỏ.',
            chef: 'Sò điệp ngọt nhẹ thôi, nhưng ngọt lâu lắm. Niềm vui lớn thì hiếm, còn niềm vui nhỏ thì ngày nào cũng có, chỉ cần mình để ý.',
            fragment: 'nhặt được thật nhiều niềm vui nhỏ',
            sprite: 'hotate',
          },
          {
            dish: 'Nhím biển uni',
            short: 'Vị của biển đọng lại, quý và hiếm có.',
            chef: 'Uni phải lặn sâu mới tìm được, vị của nó không lẫn vào đâu. Đừng quên là cháu cũng hiếm có như vậy nghe.',
            fragment: 'nhớ rằng cậu là duy nhất',
            sprite: 'uni',
          },
        ],
      },
      {
        name: 'Món nóng',
        options: [
          {
            dish: 'Tôm tempura',
            short: 'Tôm cong lưng là biểu tượng của sống lâu và khoẻ mạnh.',
            chef: 'Con tôm cong lưng giống ông bà mình lúc già, nên người xưa coi nó là điềm sống lâu. Bác chúc cháu khoẻ re, cười nhiều, sống thật lâu bên những người mình quý.',
            fragment: 'sống thật khoẻ và thật lâu',
            sprite: 'tempura',
          },
          {
            dish: 'Lươn nướng anago',
            short: 'Mềm mà dẻo dai, bền bỉ.',
            chef: 'Lươn mềm mà dai, bơi ngược dòng cũng không nản. Dịu dàng mà bền bỉ, bác thấy cháu có cái chất đó đó.',
            fragment: 'dẻo dai đi qua mọi chặng đường',
            sprite: 'anago',
          },
        ],
      },
      {
        name: 'Tráng miệng',
        options: [
          {
            dish: 'Mochi dâu',
            short: 'Chua nhẹ được bọc trong lớp ngọt.',
            chef: 'Trái dâu chua chua nằm trong lớp mochi ngọt mềm. Đời cũng có lúc chua, nhưng bác mong lúc nào cũng có thứ gì đó ngọt ngào bọc lấy cháu.',
            fragment: 'mọi điều chua cay đều được bọc trong ngọt ngào',
            sprite: 'mochi',
          },
          {
            dish: 'Pudding matcha',
            short: 'Đắng nhẹ rồi hậu ngọt.',
            chef: 'Matcha đắng một chút ở đầu lưỡi, rồi ngọt dần ra. Ngày nào khó khăn, cháu nhớ là cuối cùng sẽ ngọt lại thôi.',
            fragment: 'ngày khó nào cũng sẽ có điều ngọt ngào',
            sprite: 'matcha',
          },
        ],
      },
    ],
  },

  cafe: {
    intro: [
      { who: 'partner', text: M.caPhe.moDau },
    ],
    menuTitle: 'Thực đơn',
    categories: [
      {
        name: 'Trà',
        items: [
          { id: 'chamomile', name: 'Trà hoa cúc', desc: 'Dịu như một giấc ngủ trưa ngắn.', color: '#f2d37a', art: false },
          { id: 'peach', name: 'Trà đào cam sả', desc: 'Chua ngọt, thơm sả, mát cả buổi chiều.', color: '#f7a86b', art: false },
          { id: 'oolong', name: 'Ô long sữa', desc: 'Béo nhẹ, thơm khói trà.', color: '#d9b48c', art: false },
          { id: 'matcha', name: 'Matcha latte', desc: 'Xanh mướt, có hình vẽ sữa phía trên.', color: '#9cc27a', art: true },
          { id: 'lotus', name: 'Trà sen vàng', desc: 'Thơm hương sen, có hạt sen bùi bùi.', color: '#e8c870', art: false },
          { id: 'peachjelly', name: 'Trà thanh đào', desc: 'Thanh mát, miếng đào giòn ngọt.', color: '#f7b07a', art: false },
          { id: 'lychee', name: 'Trà thạch vải', desc: 'Vải ngọt thơm, thạch dai dai.', color: '#f6d6d8', art: false },
        ],
      },
      {
        name: 'Cà phê',
        items: [
          { id: 'latte', name: 'Latte', desc: 'Êm ái, kèm một hình vẽ sữa xinh xắn.', color: '#c89a72', art: true },
          { id: 'cappuccino', name: 'Cappuccino', desc: 'Bọt sữa bồng bềnh như mây.', color: '#b98a64', art: true },
          { id: 'bacxiu', name: 'Bạc xỉu', desc: 'Nhiều sữa ít cà phê, ngọt dịu.', color: '#d8b79a', art: false },
          { id: 'caphesua', name: 'Cà phê sữa', desc: 'Đậm đà kiểu Việt Nam, thêm đá mát lạnh.', color: '#a8744a', art: false },
          { id: 'saltcoffee', name: 'Cà phê muối', desc: 'Lớp kem muối béo mặn trên cà phê đậm.', color: '#c89a6a', art: true },
        ],
      },
      {
        name: 'Sinh tố',
        items: [
          { id: 'mango', name: 'Sinh tố xoài', desc: 'Vàng ươm như nắng sáng nay.', color: '#ffc94d', art: false },
          { id: 'strawberry', name: 'Sinh tố dâu', desc: 'Hồng hồng, chua nhẹ, dễ thương.', color: '#f58aa0', art: false },
          { id: 'avocado', name: 'Sinh tố bơ', desc: 'Béo ngậy, xanh mát, ăn như kem.', color: '#b5d37a', art: false },
          { id: 'avococo', name: 'Bơ già dừa non', desc: 'Bơ dầm béo ngậy, dừa non giòn sần sật.', color: '#c8dc8a', art: false },
        ],
      },
    ],
    partnerOrder: M.caPhe.goiNuoc,
    partnerDrinkName: 'Cà phê muối',
    partnerDrinkColor: '#c89a6a',
    // Each drink adds one line to the final wish (by drink id).
    fragments: {
      chamomile: 'luôn ngủ ngon và thức dậy thật nhẹ nhõm',
      peach: 'mỗi buổi chiều đều mát lành, thư thái',
      oolong: 'giữ được sự ấm áp dịu dàng của riêng mình',
      matcha: 'luôn tươi xanh và tràn đầy năng lượng',
      lotus: 'lúc nào cũng thanh thản như hương sen',
      peachjelly: 'mọi việc đều trôi chảy nhẹ nhàng',
      lychee: 'có thật nhiều khoảnh khắc ngọt ngào bất ngờ',
      latte: 'được bao bọc bởi những điều êm ái',
      cappuccino: 'đầu óc luôn nhẹ bẫng như bọt sữa',
      bacxiu: 'ngày nào cũng ngọt dịu như ly bạc xỉu',
      caphesua: 'luôn tỉnh táo và mạnh mẽ trước mọi thử thách',
      saltcoffee: 'biết cân bằng giữa mặn mà và ngọt ngào',
      mango: 'luôn rạng rỡ như nắng sớm',
      strawberry: 'giữ mãi sự đáng yêu của mình',
      avocado: 'luôn khoẻ mạnh, căng tràn sức sống',
      avococo: 'có những niềm vui giòn tan mỗi ngày',
    },
    barista: 'Bạn pha chế',
    served: 'Nước của hai bạn đây ạ!',
    moments: [
      { who: 'partner', text: M.caPhe.ngoiChill },
    ],
    sip: 'Nhấp một ngụm',
    sipReact: ['Ngon ghê…', 'Hợp gu ghê.', 'Đã thật.'],
    lookOut: 'Nhìn ra cửa sổ',
    lookOutReact: 'Ngoài kia có bé mèo đang phơi nắng.',
    leave: 'Ra biển thôi',
  },

  seaside: {
    intro: [
      { who: 'partner', text: M.bien.moDau },
    ],
    sandWritten: 'Sóng mang tên cậu ra biển rồi.',
    shells: ['Vỏ ốc hồng!', 'Vỏ sò có vân như cầu vồng.', 'Một vỏ ốc nhỏ xíu, nghe được tiếng biển.'],
    crab: M.bien.cua,
    lantern: M.bien.thaDen,
    lanternWish: 'Một điều ước nhỏ bay theo gió.',
    lighthouse: 'Ngọn hải đăng xa xa đẹp ghê.',
    bench: M.bien.ghe,
    exitHint: M.bien.ruDiTiep,
    exitSign: 'Núi sau trường →',
    boatLine: M.bien.tamBiet,
  },

  // ---------------------------------------------------------------- 3D
  // Mino's Discord toasts during the 3D chapters. trigger ids are fixed.
  toasts: M.tinNhanVoice, // thoại: src/thoai-mino.js

  island: {
    title: 'Núi sau trường',
    hints: {
      meadow: 'Đồi hoa',
      grove: 'Rừng anh đào',
      lake: 'Hồ trên núi',
      hill: 'Đỉnh núi',
      lighthouse: 'Chòi ngắm cảnh',
    },
    cat: 'Bé mèo ngủ mà còn mỉm cười.',
    dog: 'Bé cún vẫy đuôi muốn đi cùng!',
    swing: 'Gió lùa qua tóc…',
    blanket: 'Ngồi xuống tấm thảm, nhìn xuống sân trường.',
    telescope: 'Qua ống nhòm thấy cả thành phố lấp lánh bên dưới.',
    lighthouseTop: 'Từ trên này nhìn thấy cả trường lẫn thành phố.',
    boat: 'Thuyền trôi chầm chậm giữa hồ.',
    butterfly: 'Bướm đậu lên tay rồi!',
    balloonReady: 'Khinh khí cầu đang đợi ở bãi cỏ giữa núi.',
    ducks: 'Mấy bé vịt bơi lại ăn vụn bánh.',
    bell: 'Leng keng… tiếng chuông vang khắp rừng anh đào.',
    waterfall: 'Thác nước nhỏ róc rách.',
    // step-by-step task list shown in the corner
    guide: {
      title: 'Khám phá núi',
      optional: 'Thêm nếu thích',
      flowers: 'Hái hoa ở đồi hoa',
      grove: 'Dạo rừng anh đào',
      boat: 'Chèo thuyền trên hồ',
      tower: 'Leo lên chòi ngắm cảnh',
      telescope: 'Lên đỉnh núi, nhìn thành phố qua ống nhòm',
      balloon: 'Lên khinh khí cầu ở bãi cỏ',
      dog: 'Chơi với bé cún',
      cat: 'Vuốt ve bé mèo trên thảm picnic',
      swing: 'Ngồi xích đu gần đỉnh núi',
      ducks: 'Cho vịt ăn ở cầu gỗ',
      bell: 'Rung chuông ở cổng đỏ',
      photo: 'Chụp một tấm ảnh',
      // short labels on the floating markers
      m: { flowers: 'Đồi hoa', grove: 'Rừng anh đào', boat: 'Thuyền', tower: 'Chòi ngắm cảnh', telescope: 'Ống nhòm', balloon: 'Khinh khí cầu', dog: 'Bé cún', cat: 'Bé mèo', swing: 'Xích đu', ducks: 'Cầu gỗ', bell: 'Chuông' },
    },
  },

  balloon: {
    lines: {
      start: 'Khinh khí cầu từ từ bay lên…',
      meadow: 'Đồi hoa nhìn từ trên cao nè.',
      grove: 'Rừng anh đào như một đám mây hồng.',
      lake: 'Hồ trên núi phản chiếu cả bầu trời.',
      lighthouse: 'Sân trường nhỏ xíu bên dưới.',
      village: 'Thành phố lên đèn, lấp lánh ghê.',
      land: 'Khinh khí cầu đáp xuống đỉnh núi.',
    },
    actions: { petals: 'Thả cánh hoa', burner: 'Kéo cần lửa', wave: 'Vẫy chim', photo: 'Chụp ảnh' },
  },

  hill: {
    lieDown: 'Bầu trời đổi màu từng chút một…',
    constellationHint: 'Nhìn vào những ngôi sao sáng để nối chúng lại',
    constellations: ['Trái tim', 'Bông hoa', 'Chú mèo', 'Vương miện'],
    constellationDone: 'Chòm sao',
    telescope: 'Thành phố về đêm như một bầu trời sao thứ hai.',
    swing: 'Xích đu kẽo kẹt dưới bầu trời sao.',
    shootingStar: 'Sao băng! Ước đi…',
    wishMade: 'Điều ước đã bay lên trời rồi.',
    goVillage: 'Xuống lễ hội đèn lồng',
    guide: {
      title: 'Ngắm sao',
      optional: 'Thêm nếu thích',
      lie: 'Nằm lên tấm thảm trên đài ngắm cảnh',
      stars: 'Nhìn vào ngôi sao sáng để nối chòm sao',
      wish: 'Chờ sao băng rồi ước',
      village: 'Xuống lễ hội đèn lồng (nút góc phải)',
      telescope: 'Nhìn thành phố về đêm qua ống nhòm',
      swing: 'Ngồi xích đu dưới trời sao',
      m: { lie: 'Tấm thảm', telescope: 'Ống nhòm', swing: 'Xích đu', star: 'Nhìn vào đây ✦' },
      waiting: 'Đợi trời tối thêm chút nữa…',
    },
  },

  village: {
    arrive: 'Đèn lồng sáng khắp phố. Tiếng cười, tiếng nhạc, mùi đồ nướng…',
    ring: {
      title: 'Ném vòng',
      hint: 'Chạm để ném vòng',
      lines: ['Suýt nữa!', 'Trúng rồi!!', 'Thêm một lần nữa nè'],
      prize: 'Được một chú gấu bông nhỏ 🧸',
    },
    fish: {
      title: 'Vớt cá vàng',
      hint: 'Chạm vào một bé cá để vớt',
      caught: 'Vớt được rồi!',
      release: 'Thả các bé về suối',
      released: 'Các bé cá bơi đi vui vẻ.',
    },
    paint: {
      title: 'Vẽ đèn lồng',
      hint: 'Chọn màu cho chiếc đèn lồng',
      parts: ['Thân đèn', 'Hoa văn', 'Tua rua'],
      release: 'Thả đèn lên trời',
      released: 'Chiếc đèn bay lên giữa trời sao.',
    },
    fireworks: 'Pháo hoa nè!!',
    npcs: [
      'Chúc chị một tối thật vui nha!',
      'Hoa đăng năm nay đẹp quá trời.',
      'Cuối phố sắp có ca sĩ biểu diễn đó, đi coi đi chị!',
      'Bánh trung thu nhân không trứng muối nè, ăn hông?',
      'Chuẩn bị bắn pháo hoa rồi đó',
      'Lễ hội năm nay đông vui ghê!',
    ],
    gather: 'Mọi người đang kéo về phía sân khấu…',
    guide: {
      title: 'Lễ hội',
      optional: 'Trò chơi',
      stage: 'Đi dọc phố tới sân khấu cuối phố',
      ring: 'Ném vòng', fish: 'Vớt cá vàng', paint: 'Vẽ và thả đèn lồng', fireworks: 'Bắn pháo hoa',
      m: { stage: 'Sân khấu', ring: 'Ném vòng', fish: 'Vớt cá', paint: 'Vẽ đèn', fireworks: 'Pháo hoa' },
    },
  },

  stage: {
    intro: 'Đèn sân khấu lần lượt bật sáng…',
    screenTitle: 'Hazei',
    screenSub: 'Đêm nhạc 20/10',
    applause: 'Cả khán phòng vỗ tay rần rần!',
    bouquetLine: M.sanKhau.tangHoa,
    giftNote: M.sanKhau.themHoa,
    happy: 'Món quà đầu tiên của tớ.',
    wishTitle: 'Lời chúc cho Hazei',
    toEpilogue: 'Tiếp tục',
  },

  // Final wish = opening + five omakase fragments + closing + footer.
  wish: {
    opening: M.loiChuc.moDau,
    closing: M.loiChuc.ketThuc,
    footer: 'Chúc mừng ngày Phụ nữ Việt Nam 20/10!',
    // Used if the omakase was skipped somehow.
    defaultFragments: [
      'luôn có những khoảng bình yên cho riêng mình',
      'mỗi ngày đều bắt đầu bằng một điều háo hức',
      'nhặt được thật nhiều niềm vui nhỏ',
      'sống thật khoẻ và thật lâu',
      'ngày khó nào cũng có hậu ngọt',
    ],
    cardTitle: 'Gửi Hazei',
    saveCard: 'Lưu thiệp lời chúc',
  },

  epilogue: {
    messages: M.cuoiNgay.tinNhan,
    attachmentsLabel: 'Tệp đính kèm',
    bouquetLabel: 'Bó hoa của Hazei',
    bookmarkLabel: 'Kẹp sách hoa ép',
    replay: 'Chơi lại từ đầu',
    replayConfirm: 'Chơi lại sẽ giữ album ảnh nhưng bắt đầu lại hành trình. Chơi lại nha?',
    signoff: M.cuoiNgay.loiChao,
    downloadAll: 'Tải tất cả',
    wishLabel: 'Lời chúc',
  },

  // Song for the finale. Replace public/assets/song.mp3 with the real song.
  song: {
    file: 'assets/song.mp3',
    lyrics: 'assets/song.lrc', // optional LRC file; leave as-is if none
    title: 'Bài hát của Hazei', // TODO
    artist: 'Hazei',
  },
};
