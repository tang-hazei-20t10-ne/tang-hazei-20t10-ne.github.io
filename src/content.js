// =====================================================================
//  HAZEI'S JOURNEY · CONTENT FILE
//  Every word the player sees lives here. Edit freely (keep UTF-8).
//  Anything marked TODO is a placeholder the creator should replace.
// =====================================================================

export default {
  playerName: 'Hazei',
  partnerName: 'Anh', // TODO: tên của bạn (hiện trong hội thoại)

  // Partner look (TODO: chỉnh cho giống bạn). Colors are CSS hex.
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
  // leave null to use the generated pixel avatars. TODO
  avatars: { hazei: null, partner: null },

  discord: {
    serverName: 'Nhà Mình 🏡', // TODO
    serverInitials: 'NM',
    partnerHandle: 'anh.iu', // TODO: tên Discord của bạn
    hazeiHandle: 'hazei',
    textChannels: ['chào-buổi-sáng', 'ảnh-đẹp', 'nhạc-hay', 'kế-hoạch-đi-chơi'],
    voiceChannel: 'Chill cùng nhau',
    activityName: "Hazei's Journey",
    activityDesc: 'Một ngày đi chơi nho nhỏ, từ bình minh tới khi trời đầy sao.',
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
    // TODO: chỉnh lại cho đúng giọng của hai bạn.
    // Each item: { from: 'partner' | 'hazei', text } or { replies: [...] }
    // A replies item pauses for Hazei to tap a quick reply (or "tiếp").
    dm: [
      { from: 'partner', text: 'Hazei ơiii 👋' },
      { from: 'partner', text: 'em đang làm gì đó' },
      { replies: ['Em đang nằm lướt điện thoại nè', 'Đang chill thôi, sao dạ?'] },
      { from: 'partner', text: 'hôm nay 20/10 nè 🌷' },
      { from: 'partner', text: 'anh có chuẩn bị một chuyến đi nho nhỏ cho em' },
      { from: 'partner', text: 'không cần chuẩn bị gì hết, chỉ cần mang theo em thôi 🥰' },
      { replies: ['Hả, chuyến đi gì dạ? 👀', 'Thiệt hông đó 😳'] },
      { from: 'partner', text: 'bí mật 🤫 đi cả một ngày luôn, từ lúc mặt trời mọc tới khi có sao' },
      { from: 'partner', text: 'có hoa, có đồ ăn ngon, có biển, có cả khinh khí cầu nữa' },
      { from: 'partner', text: 'và cuối ngày có một bất ngờ to nhất 🎁' },
      { replies: ['Nghe mê quá à', 'Đi liền đi liền!'] },
      { from: 'partner', text: 'vậy vào kênh thoại với anh nha, anh đợi sẵn rồi nè' },
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
    errorBody: 'Em thử tải lại trang giúp anh nha. Tiến trình đã được lưu lại rồi.',
    reload: 'Tải lại',
    webglError: 'Trình duyệt này chưa hỗ trợ phần 3D. Em thử mở bằng Chrome hoặc Safari mới hơn nha.',
    resumeTitle: 'Mừng em quay lại',
    resume: 'Đi tiếp từ chỗ cũ',
    restart: 'Bắt đầu lại từ đầu',
    restartConfirm: 'Bắt đầu lại sẽ xoá hoa đã hái và ảnh đã chụp. Em chắc chứ?',
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
    songMissing: 'Chưa có file bài hát, anh mở tạm một giai điệu nhé',
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
    hug: 'Ôm một cái',
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
    { id: 'island', title: 'Hòn đảo lúc hoàng hôn', time: 'Giờ vàng' },
    { id: 'balloon', title: 'Khinh khí cầu trong ráng chiều', time: 'Hoàng hôn' },
    { id: 'hill', title: 'Ngọn đồi ngắm sao', time: 'Chạng vạng' },
    { id: 'village', title: 'Lễ hội đèn lồng', time: 'Đêm' },
    { id: 'stage', title: 'Sân khấu của em', time: 'Đêm' },
    { id: 'epilogue', title: 'Lời nhắn cuối ngày', time: '' },
  ],

  // ---------------------------------------------------------------- 2D
  meadow: {
    intro: [
      { who: 'partner', text: 'Chào buổi sáng nè! Nắng vừa lên là đẹp nhất đó.' },
      { who: 'partner', text: 'Mình đi chầm chậm thôi. Thấy bông nào xinh thì hái nha, anh có kế hoạch cho mấy bông hoa đó 😌' },
    ],
    firstFlower: 'Bông đó hợp với em ghê.',
    flowerReacts: ['Xinh quá!', 'Thêm một bông nè 🌼', 'Em chọn hoa khéo ghê', 'Thơm ghê luôn'],
    dog: 'Bé Mochi thích em rồi kìa, nó đòi đi theo luôn.',
    dogName: 'Mochi',
    bench: 'Ngồi đây chút đi, nhìn mặt trời lên nè.',
    benchSit: 'Gió sớm mát ghê…',
    chickens: ['Cục ta cục tác!', 'Mấy bé gà dậy sớm hơn mình nữa'],
    windmill: 'Cối xay gió quay chậm rì, nhìn mà thấy thư thả.',
    butterfly: 'Bướm đậu lên tay em kìa! Đứng yên chút nha…',
    exitHint: 'Đi tiếp ra chợ không em? Chợ sáng vui lắm.',
    exitSign: 'Chợ sáng →',
  },

  market: {
    intro: [
      { who: 'partner', text: 'Tới chợ rồi! Mùi bánh nướng thơm quá trời.' },
      { who: 'partner', text: 'Cuối dãy có tiệm chụp hình, lát mình chụp chung một dải ảnh nha.' },
    ],
    snack: {
      vendor: 'Cô bán bánh',
      lines: ['Bánh bông lan mới ra lò nè con, ăn thử đi!', 'Ngon hông? Ăn sáng là phải vui vậy đó.'],
      react: 'Mềm xốp, ngọt vừa… ngon quá trời!',
    },
    flowers: {
      vendor: 'Chị bán hoa',
      lines: ['Hoa sáng nay mới về, em ngửi thử đi.', 'Ngày 20/10 mà, cho em một bông tặng nè.'],
      react: 'Thơm dịu dịu như nắng sớm.',
    },
    hats: {
      vendor: 'Anh bán mũ',
      lines: ['Thử cái mũ cói này đi, đội lên là thành nàng thơ liền.', 'Hay kính râm cho ngầu?'],
      items: ['Mũ cói', 'Kính râm', 'Tháo ra'],
      reactHat: 'Ôi, đáng yêu quá!',
      reactGlasses: 'Ngầu xỉu luôn 😎',
    },
    fruit: {
      vendor: 'Bác bán trái cây',
      lines: ['Chào hai đứa! Hôm nay xoài ngọt lắm nha.', 'Đi chơi vui vẻ nghen, nhìn hai đứa dễ thương quá.'],
    },
    kids: { lines: ['Chị ơi chị xinh quá!', 'Chơi đuổi bắt hông chị?'] },
    pigeons: 'Mấy bé bồ câu bay lên kìa!',
    booth: {
      title: 'Tiệm Chụp Hình Tí Hon',
      intro: 'Chụp bốn tấm nha! Mỗi tấm em chọn phông nền và tạo dáng.',
      frame: 'Tấm',
      chooseBackdrop: 'Chọn phông nền',
      choosePose: 'Chọn kiểu tạo dáng',
      backdrops: ['Vườn hoa', 'Biển xanh', 'Trời sao', 'Kẹo ngọt'],
      poses: ['Bắn tim', 'Hai ngón tay', 'Tựa vai', 'Mặt ngố', 'Mũ cói', 'Nhảy lên'],
      countdown: ['3', '2', '1', 'Tách!'],
      done: 'Dải ảnh xinh quá! Anh cất vào album rồi nha.',
      stripTitle: 'Hazei & Anh', // TODO
      download: 'Tải dải ảnh',
      continue: 'Đi tiếp',
    },
    exitHint: 'Mình ra ga nha, tàu sắp chạy rồi.',
    exitSign: 'Ga tàu →',
  },

  train: {
    intro: [
      { who: 'partner', text: 'Ngồi sát cửa sổ nè. Giờ chỉ cần ngắm thôi, không cần làm gì hết.' },
    ],
    actions: {
      window: 'Mở cửa sổ',
      windowClose: 'Đóng cửa sổ',
      wave: 'Vẫy tay',
      snack: 'Chia bánh',
      music: 'Chọn nhạc',
    },
    songs: ['Đồng lúa', 'Mây trôi', 'Ga nhỏ', 'Ngủ trưa'],
    musicTitle: 'Nhạc trong toa',
    sights: {
      terraces: 'Ruộng bậc thang vàng óng…',
      lake: 'Mặt hồ phẳng như gương.',
      tunnel: 'Đường hầm có trần lấp lánh như sao!',
      town: 'Một thị trấn nhỏ trên đồi.',
      kids: 'Mấy bé đang vẫy tay với mình kìa!',
      balloons: 'Xa xa có khinh khí cầu… lát nữa mình cũng được bay đó.',
    },
    snackLines: ['Một nửa cho em, một nửa cho anh.', 'Bánh ngon hơn khi ăn chung.'],
    waveReact: 'Các bé vẫy lại kìa!',
    windowReact: 'Gió thơm mùi lúa.',
    arrive: 'Sắp tới ga rồi. Gần ga có một tiệm sách cũ xinh lắm.',
    arriveButton: 'Xuống tàu',
  },

  bookshop: {
    intro: [
      { who: 'partner', text: 'Tiệm sách này cũ mà ấm ghê. Có cả góc đĩa than nữa.' },
      { who: 'partner', text: 'Đừng đánh thức bé mèo nha, nó ngủ ngon lắm 😴' },
    ],
    // Original lines written for this game.
    books: [
      { title: 'Những buổi sáng chậm', line: '“Không cần vội. Hoa nở đúng mùa của nó, và em cũng vậy.”' },
      { title: 'Bản đồ của gió', line: '“Can đảm đôi khi chỉ là bước thêm một bước nhỏ, dù tim còn run.”' },
      { title: 'Cô gái giữ ánh đèn', line: '“Hãy cứ là chính mình. Thế giới có đủ người khác rồi, nhưng chỉ có một em.”' },
      { title: 'Mùa hè ở ga xép', line: '“Hy vọng giống chuyến tàu đêm: chậm thôi, nhưng chưa bao giờ ngừng tới.”' },
      { title: 'Ngày mưa có nắng', line: '“Có những ngày mây nhiều, nhưng mặt trời chưa từng đi đâu xa.”' },
      { title: 'Thư gửi chính mình', line: '“Em đã đi được xa đến vậy. Hãy dịu dàng với bản thân thêm chút nữa.”' },
    ],
    records: [
      { title: 'Chiều phố cũ', style: 'jazz' },
      { title: 'Mưa trên mái ngói', style: 'lofi' },
      { title: 'Vũ điệu tách trà', style: 'waltz' },
      { title: 'Đèn đường', style: 'bossa' },
    ],
    recordsTitle: 'Chọn một đĩa than',
    partnerRecs: [
      'Cuốn “Thư gửi chính mình” hay lắm, anh đọc rồi.',
      'Đĩa “Đèn đường” nghe mà muốn lắc lư theo.',
      'Em đọc được câu nào hay không? Đọc anh nghe với.',
    ],
    cat: 'Bé mèo kêu rừ rừ kìa…',
    bookmark: {
      name: 'Kẹp sách hoa ép',
      desc: 'Một chiếc kẹp sách có ép bông cúc nhỏ. Cô chủ tiệm tặng em.',
      line: 'Cô chủ tiệm nói: “Tặng cháu nè, giữ lại làm kỷ niệm nha.”',
    },
    exitHint: 'Đói bụng chưa? Anh đặt bàn omakase rồi đó.',
    exitSign: 'Đi ăn trưa →',
  },

  omakase: {
    chefName: 'Bác đầu bếp',
    intro: [
      { who: 'chef', text: 'Chào mừng hai cháu! Hôm nay bác chuẩn bị năm lượt món.' },
      { who: 'chef', text: 'Mỗi lượt có hai món, cháu chọn món nào cũng được. Món nào cũng mang một lời chúc riêng.' },
      { who: 'partner', text: 'Em cứ chọn theo cảm giác nha, chọn gì cũng đúng hết.' },
    ],
    choose: 'Em chọn món nào?',
    roundWord: 'Lượt',
    fragmentNote: 'Một mảnh lời chúc đã được cất đi ✨',
    outro: [
      { who: 'chef', text: 'Năm lời chúc nhỏ, bác gói lại cho cháu rồi đó. Tối nay cháu sẽ thấy.' },
      { who: 'partner', text: 'Cảm ơn bác! Bữa trưa ngon nhất năm luôn.' },
    ],
    rounds: [
      {
        name: 'Khai vị',
        options: [
          {
            dish: 'Trứng hấp chawanmushi',
            short: 'Mềm như một buổi sáng không vội vã.',
            chef: 'Trứng phải hấp lửa thật nhỏ, không được vội, thì mặt mới mịn như vầy. Bác mong ngày nào của cháu cũng có lúc chậm lại như vậy, để mình được thở và được thương chính mình.',
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
            short: 'Hiếm và béo ngậy, chỉ dành cho lúc muốn trân trọng.',
            chef: 'Otoro là phần quý nhất của con cá, bác chỉ mời người đặc biệt thôi. Cháu xứng đáng được đối xử nâng niu như vậy, ở bất cứ đâu.',
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
            chef: 'Uni phải lặn sâu mới tìm được, vị của nó không lẫn vào đâu. Đừng bao giờ quên là cháu cũng hiếm có như vậy nghe.',
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
            chef: 'Con tôm cong lưng giống ông bà mình lúc già, nên người xưa coi nó là điềm sống lâu. Bác chúc cháu khoẻ re, cười nhiều, sống thật lâu bên người thương.',
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
            chef: 'Trái dâu chua chua nằm trong lớp mochi ngọt mềm. Đời cũng có lúc chua, nhưng bác mong lúc nào cũng có người bọc cho cháu một lớp ngọt ngào.',
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
      { who: 'partner', text: 'Ăn xong thì phải có nước nè. Em chọn món gì cũng được, anh bao 😎' },
    ],
    menuTitle: 'Thực đơn',
    categories: [
      {
        name: 'Trà',
        items: [
          { id: 'chamomile', name: 'Trà hoa cúc', desc: 'Dịu như một giấc ngủ trưa ngắn.', color: '#f2d37a', art: false },
          { id: 'peach', name: 'Trà đào cam sả', desc: 'Chua ngọt, thơm sả, mát cả buổi chiều.', color: '#f7a86b', art: false },
          { id: 'oolong', name: 'Ô long sữa', desc: 'Béo nhẹ, thơm khói trà, uống là thương.', color: '#d9b48c', art: false },
          { id: 'matcha', name: 'Matcha latte', desc: 'Xanh mướt, có trái tim sữa nằm trên.', color: '#9cc27a', art: true },
        ],
      },
      {
        name: 'Cà phê',
        items: [
          { id: 'latte', name: 'Latte', desc: 'Êm ái, kèm một trái tim sữa xinh xắn.', color: '#c89a72', art: true },
          { id: 'cappuccino', name: 'Cappuccino', desc: 'Bọt sữa bồng bềnh như mây.', color: '#b98a64', art: true },
          { id: 'bacxiu', name: 'Bạc xỉu', desc: 'Nhiều sữa ít cà phê, ngọt như em.', color: '#d8b79a', art: false },
        ],
      },
      {
        name: 'Sinh tố',
        items: [
          { id: 'mango', name: 'Sinh tố xoài', desc: 'Vàng ươm như nắng sáng nay.', color: '#ffc94d', art: false },
          { id: 'strawberry', name: 'Sinh tố dâu', desc: 'Hồng hồng, chua nhẹ, rất dễ thương.', color: '#f58aa0', art: false },
          { id: 'avocado', name: 'Sinh tố bơ', desc: 'Béo ngậy, xanh mát, ăn như kem.', color: '#b5d37a', art: false },
        ],
      },
    ],
    partnerOrder: 'Cho anh một Caramel Macchiato nha!',
    partnerDrinkName: 'Caramel Macchiato',
    barista: 'Bạn pha chế',
    served: 'Nước của hai bạn đây ạ! Có tim cho cặp đôi luôn nè.',
    moments: [
      { who: 'partner', text: 'Ngồi đây nhìn ra cửa sổ, thấy hôm nay trôi chậm ghê.' },
      { who: 'partner', text: 'Cảm ơn em đã đi cùng anh cả buổi nha.' },
      { who: 'partner', text: 'Chiều nay mình ra biển. Có một điều anh muốn em viết lên cát 😊' },
    ],
    sip: 'Nhấp một ngụm',
    sipReact: ['Ngon ghê…', 'Ấm cả lòng.', 'Hợp gu em quá.'],
    lookOut: 'Nhìn ra cửa sổ',
    lookOutReact: 'Ngoài kia có bé mèo đang phơi nắng.',
    leave: 'Ra biển thôi',
  },

  seaside: {
    intro: [
      { who: 'partner', text: 'Biển nè! Nắng chiều vàng như mật ong vậy.' },
      { who: 'partner', text: 'Em viết tên mình lên cát thử đi, rồi coi sóng mang nó đi đâu.' },
    ],
    sandWritten: 'Sóng mang tên em ra biển rồi… giờ cả biển đều biết tên em.',
    shells: ['Vỏ ốc hồng!', 'Vỏ sò có vân như cầu vồng.', 'Một vỏ ốc nhỏ xíu, nghe được tiếng biển.'],
    crab: 'Bạn cua bò ngang qua chào em kìa 🦀',
    lantern: 'Đèn bay lên rồi… em ước gì vậy?',
    lanternWish: 'Một điều ước nhỏ bay theo gió.',
    lighthouse: 'Thấy ngọn hải đăng xa xa không? Lát nữa mình sẽ tới gần nó.',
    bench: 'Ngồi đây nghe sóng chút nha.',
    exitHint: 'Có một chiếc thuyền đưa mình ra đảo đó. Đi không em?',
    exitSign: 'Ra đảo →',
    boatLine: 'Từ đây em đi một mình chút nha. Anh vẫn ở trong kênh thoại đó, có gì nhắn anh 💬',
  },

  // ---------------------------------------------------------------- 3D
  // Partner "Discord" toasts during 3D chapters. trigger ids are fixed;
  // edit the text freely.
  toasts: {
    island_arrive: 'em tới đảo rồi hả? nắng chiều đẹp quá trời 🌅',
    island_flower: 'hái thêm vài bông nữa nha, anh có kế hoạch cho tụi nó 😌',
    island_cat: 'con mèo đó ngủ say như em hồi sáng 🙈',
    island_lighthouse: 'leo lên hải đăng thử đi, nghe nói view đỉnh lắm',
    island_swing: 'đu nhẹ thôi nha, anh lo đó 😆',
    island_boat: 'chèo thuyền giỏi ghê ta',
    island_balloon: 'thấy khinh khí cầu chưa? lên đó đi em ✨',
    balloon_start: 'bay rồi!! nhớ nhìn xuống coi hòn đảo nha',
    balloon_village: 'cái chỗ sáng sáng đằng xa là làng đèn lồng đó',
    balloon_land: 'đáp nhẹ nhàng quá. đợi trời tối chút nha',
    hill_arrive: 'nằm xuống ngắm trời thử đi, sắp có sao rồi',
    hill_star: 'thấy sao băng chưa? ước đi em ⭐',
    village_arrive: 'tới lễ hội rồi! chơi hết mấy trò đi nha',
    village_stage: 'đi tới cuối phố đi em… có người đang đợi em đó',
  },

  island: {
    title: 'Hòn đảo nhỏ',
    hints: {
      meadow: 'Đồng hoa',
      grove: 'Rừng anh đào',
      lake: 'Hồ nước',
      hilltop: 'Đỉnh đồi',
      lighthouse: 'Hải đăng',
    },
    cat: 'Bé mèo ngủ mà còn mỉm cười.',
    dog: 'Bé cún vẫy đuôi muốn đi cùng em!',
    swing: 'Gió lùa qua tóc…',
    blanket: 'Ngồi xuống tấm thảm picnic, nghe sóng xa xa.',
    telescope: 'Qua ống nhòm thấy cả ngôi làng đèn lồng phía xa.',
    lighthouseTop: 'Từ trên này nhìn được cả hòn đảo.',
    boat: 'Thuyền trôi chầm chậm giữa hồ.',
    butterfly: 'Bướm đậu lên tay em!',
    balloonReady: 'Khinh khí cầu đang đợi em ở bãi cỏ.',
  },

  balloon: {
    lines: {
      start: 'Khinh khí cầu từ từ bay lên…',
      meadow: 'Đồng hoa em vừa đi qua nè.',
      grove: 'Rừng anh đào nhìn từ trên cao như một đám mây hồng.',
      lake: 'Mặt hồ phản chiếu cả bầu trời.',
      lighthouse: 'Ngọn hải đăng vừa bật đèn.',
      village: 'Làng đèn lồng lấp lánh phía xa.',
      land: 'Khinh khí cầu đáp xuống một ngọn đồi yên tĩnh.',
    },
    actions: { petals: 'Thả cánh hoa', burner: 'Kéo cần lửa', wave: 'Vẫy chim', photo: 'Chụp ảnh' },
  },

  hill: {
    lieDown: 'Bầu trời đổi màu từng chút một…',
    constellationHint: 'Nhìn vào những ngôi sao sáng để nối chúng lại',
    constellations: ['Trái tim', 'Bông hoa', 'Chú mèo', 'Vương miện'],
    constellationDone: 'Chòm sao',
    telescope: 'Qua ống kính thấy cả vành đai sao lấp lánh.',
    swing: 'Xích đu kẽo kẹt dưới bầu trời sao.',
    shootingStar: 'Sao băng! Em ước đi…',
    wishMade: 'Điều ước đã bay lên trời rồi.',
    goVillage: 'Xuống làng đèn lồng',
  },

  village: {
    arrive: 'Đèn lồng sáng khắp phố. Tiếng cười, tiếng nhạc, mùi đồ nướng…',
    ring: {
      title: 'Ném vòng',
      hint: 'Chạm để ném vòng',
      lines: ['Suýt nữa!', 'Trúng rồi!!', 'Thêm một lần nữa nè'],
      prize: 'Em được một chú gấu bông nhỏ 🧸',
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
      hint: 'Chọn màu cho chiếc đèn lồng của em',
      parts: ['Thân đèn', 'Hoa văn', 'Tua rua'],
      release: 'Thả đèn lên trời',
      released: 'Chiếc đèn của em bay lên giữa trời sao.',
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
    bouquetLine: 'Bó hoa này là từ những bông em hái suốt hôm nay đó. Anh chỉ gói lại thôi.',
    giftNote: 'Anh thêm vài bông cho bó hoa thêm đầy đặn nè.',
    happy: 'Hazei ôm bó hoa, cười tít mắt.',
    wishTitle: 'Lời chúc của em',
    toEpilogue: 'Tiếp tục',
  },

  // Final wish = opening + five omakase fragments + closing + footer.
  wish: {
    opening: 'Hazei à, anh chúc em…',
    closing: 'Cảm ơn em vì đã là em. Anh thương em nhiều lắm.', // TODO: lời của bạn
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
      'em ơi, chuyến đi hôm nay tới đây là hết rồi 🥹',
      'cảm ơn em đã đi cùng anh từ lúc mặt trời mọc tới khi trời đầy sao',
      'anh gửi lại em mấy tấm ảnh với kỷ niệm của hôm nay nè',
    ],
    attachmentsLabel: 'Tệp đính kèm',
    bouquetLabel: 'Bó hoa của em',
    bookmarkLabel: 'Kẹp sách hoa ép',
    replay: 'Chơi lại từ đầu',
    replayConfirm: 'Chơi lại sẽ giữ album ảnh nhưng bắt đầu lại hành trình. Đi lại nha?',
    signoff: 'mãi yêu em 💗', // TODO
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
