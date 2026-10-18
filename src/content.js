// =====================================================================
//  HAZEI'S JOURNEY · CONTENT FILE
//  Every word the player sees lives here. Edit freely (keep UTF-8).
//  Anything marked TODO is a placeholder the creator should replace.
// =====================================================================

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
    dm: [
      { from: 'partner', text: 'ê Hazei' },
      { from: 'partner', text: 'rảnh hông' },
      { replies: ['Rảnh nè, sao á?', 'Đang nằm chill nè'] },
      { from: 'partner', text: 'nay 20/10, tớ có làm cái này cho cậu 😆' },
      { from: 'partner', text: 'một chuyến đi chơi nho nhỏ, chơi trong discord luôn' },
      { replies: ['Hả, gì vậy 👀', 'Nghe hay á'] },
      { from: 'partner', text: 'vô voice đi rồi biết' },
      { from: 'partner', invite: true },
    ],
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
    wave: 'Vẫy tay',
  },


  chapters: [
    { id: 'discord', title: 'Mở đầu', time: '' },
    { id: 'meadow', title: 'Bình minh trên đồng cỏ', time: 'Bình minh' },
    { id: 'market', title: 'Chợ sáng & tiệm chụp hình', time: 'Buổi sáng' },
    { id: 'train', title: 'Chuyến tàu về miền quê', time: 'Gần trưa' },
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
      { who: 'partner', text: 'Sáng sớm đẹp ghê. Thấy hoa nào xinh thì cậu hái nha, lát có việc dùng tới đó.' },
    ],
    firstFlower: 'Bông đó xinh nè.',
    flowerReacts: ['Đẹp đó!', 'Thêm một bông 🌼', 'Ổn áp'],
    dog: 'Bé Mochi chịu cậu rồi đó, đòi đi theo luôn.',
    dogName: 'Mochi',
    bench: 'Ngồi nghỉ chút nè.',
    benchSit: 'Gió sớm mát ghê…',
    chickens: ['Cục ta cục tác!', 'Mấy bé gà dậy sớm hơn tụi mình luôn'],
    windmill: 'Cối xay gió quay chậm rì.',
    butterfly: 'Bướm đậu lên tay cậu kìa!',
    exitHint: 'Ra chợ không? Chợ sáng vui lắm.',
    exitSign: 'Chợ sáng →',
    // Mino offers to take a photo at the sunrise spot
    photoAsk: 'Cậu muốn chụp hình ở đây không, tớ chụp cho?',
    photoChoices: ['Chụp đi!', 'Thôi khỏi'],
    photoReady: 'Rồi, cười lên nè… 1, 2, 3!',
    photoNo: 'Oke!',
    photoCaption: 'Bình minh trên đồng cỏ',
  },

  market: {
    intro: [
      { who: 'partner', text: 'Tới chợ rồi. Cuối dãy có tiệm chụp hình, lát ghé chụp một dải nha.' },
    ],
    snack: {
      vendor: 'Cô bán bánh',
      lines: ['Bánh bông lan mới ra lò nè con, ăn thử đi!', 'Ngon hông? Ăn sáng là phải vui vậy đó.'],
      react: 'Mềm xốp, ngon quá trời!',
    },
    flowers: {
      vendor: 'Chị bán hoa',
      lines: ['Hoa sáng nay mới về, em ngửi thử đi.', 'Ngày 20/10 mà, chị tặng em một bông nè.'],
      react: 'Thơm dịu dịu.',
    },
    hats: {
      vendor: 'Anh bán mũ',
      lines: ['Thử cái mũ cói này đi em, hợp lắm.', 'Hay kính râm cho ngầu?'],
      items: ['Mũ cói', 'Kính râm', 'Tháo ra'],
      reactHat: 'Hợp phết!',
      reactGlasses: 'Ngầu đó 😎',
    },
    fruit: {
      vendor: 'Bác bán trái cây',
      lines: ['Chào hai đứa! Hôm nay xoài ngọt lắm nha.', 'Đi chơi vui vẻ nghen.'],
    },
    kids: { lines: ['Chị ơi chị xinh quá!', 'Chơi đuổi bắt hông chị?'] },
    pigeons: 'Bồ câu bay hết rồi kìa!',
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
    exitHint: 'Ra ga thôi, tàu sắp chạy rồi.',
    exitSign: 'Ga tàu →',
  },

  train: {
    intro: [
      { who: 'partner', text: 'Giờ thì ngồi ngắm cảnh thôi.' },
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
    arrive: 'Sắp tới ga rồi. Gần ga có tiệm sách cũ xinh lắm.',
    arriveButton: 'Xuống tàu',
  },

  bookshop: {
    intro: [
      { who: 'partner', text: 'Tiệm sách này có cả góc đĩa than nữa. Đừng đánh thức bé mèo nha 😴' },
    ],
    // Original lines written for this game.
    books: [
      { title: 'Những buổi sáng chậm', line: '“Không cần vội. Hoa nở đúng mùa của nó, và cậu cũng vậy.”' },
      { title: 'Bản đồ của gió', line: '“Can đảm đôi khi chỉ là bước thêm một bước nhỏ, dù tim còn run.”' },
      { title: 'Cô gái giữ ánh đèn', line: '“Cứ là chính mình đi. Thế giới có đủ người khác rồi, nhưng chỉ có một bạn thôi.”' },
      { title: 'Mùa hè ở ga xép', line: '“Hy vọng giống chuyến tàu đêm: chậm thôi, nhưng chưa bao giờ ngừng tới.”' },
      { title: 'Ngày mưa có nắng', line: '“Có những ngày mây nhiều, nhưng mặt trời chưa từng đi đâu xa.”' },
      { title: 'Thư gửi chính mình', line: '“Bạn đã đi được xa đến vậy rồi. Dịu dàng với bản thân thêm chút nữa nhé.”' },
    ],
    records: [
      { title: 'Chiều phố cũ', style: 'jazz' },
      { title: 'Mưa trên mái ngói', style: 'lofi' },
      { title: 'Vũ điệu tách trà', style: 'waltz' },
      { title: 'Đèn đường', style: 'bossa' },
    ],
    recordsTitle: 'Chọn một đĩa than',
    partnerRecs: [
      'Cuốn “Thư gửi chính mình” hay lắm đó.',
      'Đĩa “Đèn đường” nghe cuốn ghê.',
    ],
    cat: 'Bé mèo kêu rừ rừ kìa…',
    bookmark: {
      name: 'Kẹp sách hoa ép',
      desc: 'Một chiếc kẹp sách có ép bông cúc nhỏ, quà của cô chủ tiệm.',
      line: 'Cô chủ tiệm nói: “Tặng cháu nè, giữ làm kỷ niệm nha.”',
    },
    exitHint: 'Đói chưa? Đi ăn trưa thôi.',
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
      { who: 'partner', text: 'Cảm ơn bác, ngon thật sự!' },
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
            fragment: 'nhớ rằng mình quý và hiếm có',
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
            fragment: 'ngày khó nào cũng có hậu ngọt',
            sprite: 'matcha',
          },
        ],
      },
    ],
  },

  cafe: {
    intro: [
      { who: 'partner', text: 'Chọn nước đi, bữa nay tớ bao 😎' },
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
        ],
      },
      {
        name: 'Cà phê',
        items: [
          { id: 'latte', name: 'Latte', desc: 'Êm ái, kèm một hình vẽ sữa xinh xắn.', color: '#c89a72', art: true },
          { id: 'cappuccino', name: 'Cappuccino', desc: 'Bọt sữa bồng bềnh như mây.', color: '#b98a64', art: true },
          { id: 'bacxiu', name: 'Bạc xỉu', desc: 'Nhiều sữa ít cà phê, ngọt dịu.', color: '#d8b79a', art: false },
        ],
      },
      {
        name: 'Sinh tố',
        items: [
          { id: 'mango', name: 'Sinh tố xoài', desc: 'Vàng ươm như nắng sáng nay.', color: '#ffc94d', art: false },
          { id: 'strawberry', name: 'Sinh tố dâu', desc: 'Hồng hồng, chua nhẹ, dễ thương.', color: '#f58aa0', art: false },
          { id: 'avocado', name: 'Sinh tố bơ', desc: 'Béo ngậy, xanh mát, ăn như kem.', color: '#b5d37a', art: false },
        ],
      },
    ],
    partnerOrder: 'Cho tớ một Caramel Macchiato nha!',
    partnerDrinkName: 'Caramel Macchiato',
    barista: 'Bạn pha chế',
    served: 'Nước của hai bạn đây ạ!',
    moments: [
      { who: 'partner', text: 'Ngồi đây nhìn ra cửa sổ thấy chill ghê. Chiều mình ra biển nha.' },
    ],
    sip: 'Nhấp một ngụm',
    sipReact: ['Ngon ghê…', 'Hợp gu ghê.', 'Đã thật.'],
    lookOut: 'Nhìn ra cửa sổ',
    lookOutReact: 'Ngoài kia có bé mèo đang phơi nắng.',
    leave: 'Ra biển thôi',
  },

  seaside: {
    intro: [
      { who: 'partner', text: 'Biển nè! Cậu thử viết tên lên cát coi.' },
    ],
    sandWritten: 'Sóng mang tên cậu ra biển rồi.',
    shells: ['Vỏ ốc hồng!', 'Vỏ sò có vân như cầu vồng.', 'Một vỏ ốc nhỏ xíu, nghe được tiếng biển.'],
    crab: 'Có bạn cua kìa 🦀',
    lantern: 'Bay lên rồi kìa!',
    lanternWish: 'Một điều ước nhỏ bay theo gió.',
    lighthouse: 'Ngọn hải đăng xa xa đẹp ghê.',
    bench: 'Ngồi nghe sóng chút nha.',
    exitHint: 'Lát lên núi sau trường ngắm hoàng hôn không?',
    exitSign: 'Núi sau trường →',
    boatLine: 'Tớ phải về nhà một chút, cậu lên núi trước nha. Tớ vẫn ở trong voice đó 💬',
  },

  // ---------------------------------------------------------------- 3D
  // Mino's Discord toasts during the 3D chapters. trigger ids are fixed.
  toasts: {
    island_arrive: 'lên núi chưa? giờ này nắng đẹp nhất đó 🌅',
    island_flower: 'hái thêm vài bông nha, lát có việc dùng 😌',
    island_cat: 'con mèo đó ngủ ngon ghê',
    island_lighthouse: 'leo lên chòi ngắm cảnh thử đi, view đỉnh lắm',
    island_swing: 'đu nhẹ thôi nha 😆',
    island_boat: 'chèo thuyền giỏi ghê ta',
    island_balloon: 'thấy khinh khí cầu chưa? lên thử đi ✨',
    balloon_start: 'bay rồi!! nhìn xuống thành phố coi',
    balloon_village: 'thành phố lên đèn rồi kìa',
    balloon_land: 'đáp rồi hả. đợi trời tối chút nha',
    hill_arrive: 'nằm xuống ngắm trời thử đi, sắp có sao rồi',
    hill_star: 'thấy sao băng chưa? ước lẹ lên ⭐',
    village_arrive: 'tới lễ hội rồi! chơi hết mấy trò đi',
    village_stage: 'đi tới cuối phố đi, có bất ngờ đó',
  },

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
      'Cuối phố sắp có biểu diễn đó, đi coi đi chị!',
      'Bánh trung thu nhân trứng muối nè, ăn hông?',
    ],
    gather: 'Mọi người đang kéo về phía sân khấu…',
  },

  stage: {
    intro: 'Đèn sân khấu lần lượt bật sáng…',
    applause: 'Cả khán phòng vỗ tay rần rần!',
    bouquetLine: 'Hát hay quá trời! Bó hoa này làm từ mấy bông cậu hái hôm nay đó, tớ chỉ gói lại thôi.',
    giftNote: 'Tớ thêm vài bông cho đầy đặn nha.',
    happy: 'Hazei ôm bó hoa, cười tít mắt.',
    wishTitle: 'Lời chúc cho Hazei',
    toEpilogue: 'Tiếp tục',
  },

  // Final wish = opening + five omakase fragments + closing + footer.
  wish: {
    opening: 'Hazei ơi, tớ chúc cậu…',
    closing: 'Cảm ơn cậu đã là một người bạn tuyệt vời.', // TODO: lời của Mino
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
    messages: [
      'hết chuyến đi rồi đó 😆',
      'tớ gửi lại mấy tấm ảnh với kỷ niệm hôm nay nè',
    ],
    attachmentsLabel: 'Tệp đính kèm',
    bouquetLabel: 'Bó hoa của Hazei',
    bookmarkLabel: 'Kẹp sách hoa ép',
    replay: 'Chơi lại từ đầu',
    replayConfirm: 'Chơi lại sẽ giữ album ảnh nhưng bắt đầu lại hành trình. Chơi lại nha?',
    signoff: '20/10 vui vẻ nha 🌷', // TODO
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
