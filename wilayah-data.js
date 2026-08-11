// Master Data Wilayah Indonesia & Jawa Barat Lengkap (Puskesmas Banjaran Kota)
// Sumber data: Data Wilayah Kemendagri / API Wilayah Indonesia (emsifa/api-wilayah-indonesia)

const WILAYAH_DATA = {
  "Jawa Barat": {
    "Kabupaten Bandung": {
      "Banjaran": [
        "Banjaran Kulon",
        "Banjaran Wetan",
        "Ciapus",
        "Kamasan",
        "Kiangroke",
        "Margahayu",
        "Neglasari",
        "Pasirhuni",
        "Sindangpanon",
        "Tarajusari"
      ],
      "Cangkuang": [
        "Bandasari",
        "Cangkuang",
        "Ciluncat",
        "Jatisari",
        "Nagrak",
        "Tanjungsari"
      ],
      "Pameungpeuk": [
        "Arjasari",
        "Batukarut",
        "Langonsari",
        "Rancamanyar",
        "Rancatungku",
        "Sukasari"
      ],
      "Arjasari": [
        "Ancolmekar",
        "Arjasari",
        "Baros",
        "Batamakar",
        "Lébaktujuh",
        "Mangunjaya",
        "Pinggirsari",
        "Rancakole",
        "Wargaluyu"
      ],
      "Cimaung": [
        "Cikalong",
        "Cimaung",
        "Cipinang",
        "Jagabaya",
        "Malasari",
        "Mekarsari",
        "Pasirhuni",
        "Sukamaju",
        "Warjabakti"
      ],
      "Soreang": [
        "Cingcin",
        "Karamatmulya",
        "Panyirapan",
        "Parungserab",
        "Sukanagara",
        "Soreang",
        "Sekarwangi",
        "Waduas"
      ],
      "Katapang": [
        "Banyusari",
        "Gandasari",
        "Katapang",
        "Pangauban",
        "Sangkanhurip",
        "Sukanagara",
        "Sukasari"
      ],
      "Baleendah": [
        "Andir",
        "Baleendah",
        "Bojongmalaka",
        "Malakasari",
        "Margahayu Selatan",
        "Rancamanyar",
        "Wargamekar"
      ],
      "Dayeuhkolot": [
        "Cangkuang Barat",
        "Cangkuang Timur",
        "Dayeuhkolot",
        "Pasawahan",
        "Sukapura"
      ],
      "Margahayu": [
        "Sayati",
        "Sukamenak",
        "Sulaiman",
        "Margahayu Selatan",
        "Margahayu Tengah"
      ],
      "Margaasih": [
        "Cigondewah Hilir",
        "Lagadar",
        "Margaasih",
        "Mekar Rahayu",
        "Nanjung",
        "Rahayu"
      ],
      "Ciwidey": [
        "Ciwidey",
        "Lebakmuncang",
        "Nengkelan",
        "Panyocokan",
        "Rawabogo",
        "Sukawening"
      ],
      "Pasirjambu": [
        "Cisondari",
        "Cukanggenteng",
        "Margamulya",
        "Pasirjambu",
        "Tenjolaya",
        "Yosowilangun"
      ],
      "Rancabali": [
        "Alamendah",
        "Cipelah",
        "Indragiri",
        "Patengan",
        "Sukaresmi"
      ],
      "Pangalengan": [
        "Banjarsari",
        "Lamajang",
        "Margaluyu",
        "Margamukti",
        "Pangalengan",
        "Purbasari",
        "Sukamanah",
        "Tribaktimulya",
        "Wanasuka",
        "Warnasari"
      ],
      "Bojongsoang": [
        "Bojongsoang",
        "Bojongsari",
        "Buahbatu",
        "Cipagalo",
        "Lengkong",
        "Tegalluar"
      ],
      "Cileunyi": [
        "Cileunyi Kulon",
        "Cileunyi Wetan",
        "Cimekar",
        "Cinunuk",
        "Cipacing"
      ],
      "Rancaekek": [
        "Bojongloa",
        "Bojongsalam",
        "Cangkuang",
        "Cileunyi",
        "Hargeulis",
        "Jelegong",
        "Linggar",
        "Nanjungmekar",
        "Rancaekek Kencana",
        "Rancaekek Kulon",
        "Rancaekek Wetan",
        "Sangkanhurip",
        "Sukamanah",
        "Sukai"
      ],
      "Majalaya": [
        "Bo Jong",
        "Majakerta",
        "Majalaya",
        "Majasetra",
        "Neglasari",
        "Padamulya",
        "Padaulun",
        "Sukumukti",
        "Wangisagara"
      ],
      "Ciparay": [
        "Babakan",
        "Ciheulang",
        "Ciparay",
        "Gunungleutik",
        "Manggungharja",
        "Mekarsari",
        "Pakutandang",
        "Sarimahi",
        "Serangmekar",
        "Sumbersari"
      ]
    },
    "Kota Bandung": {
      "Coblong": ["Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa", "Cipaganti"],
      "Sumur Bandung": ["Braga", "Kebon Pisang", "Merdeka", "Babakan Ciamis"],
      "Lengkong": ["Burangrang", "Cijagra", "Cikawao", "Lingkar Selatan", "Malabar", "Paledang", "Turangga"],
      "Bandung Wetan": ["Cihapit", "Citarum", "Taman Sari"],
      "Cicendo": ["Arjuna", "Husen Sastranegara", "Pajajaran", "Pamoyanan", "Pasirkaliki", "Sukaraja"],
      "Andir": ["Campaka", "Ciroyom", "Dungus Cariang", "Garuda", "Kebon Jeruk", "Maleber"],
      "Regol": ["Ancol", "Balonggede", "Ciateul", "Cigereleng", "Ciseureuh", "Pasirluyu", "Pungkur"],
      "Buahbatu": ["Cijaura", "Jatisari", "Margasari", "Sekejati"],
      "Kiaracondong": ["Babakan Surabaya", "Babakan Sari", "Cicaheum", "Kebon Jayanti", "Kebon Kangkung", "Sukapura"]
    },
    "Kota Cimahi": {
      "Cimahi Utara": ["Cipageran", "Citeureup", "Pasirkaliki", "Cibabat"],
      "Cimahi Tengah": ["Baros", "Cigugur Tengah", "Karangmekar", "Padasuka", "Setiamanah"],
      "Cimahi Selatan": ["Cibeber", "Cibeureum", "Leuwigajah", "Melong", "Utama"]
    },
    "Kabupaten Bandung Barat": {
      "Padalarang": ["Cipadung", "Cimerang", "Kertajaya", "Kertamulya", "Laksana", "Padalarang", "Tagogapu"],
      "Ngamprah": ["Cilame", "Cimanggu", "Gadobangkong", "Margajaya", "Mekarsari", "Ngamprah", "Sukatani", "Tanimulya"],
      "Lembang": ["Cikole", "Gudangkahuripan", "Jayagiri", "Kayuambon", "Lembang", "Langensari", "Suntenjaya"],
      "Parongpong": ["Cihanjuang", "Cihanjuang Rahayu", "Cigugur Girang", "Karyawangi", "Sariwangi"],
      "Cisarua": ["Cipada", "Jambudipa", "Pasirhalang", "Pasirguci", "Sadangmekar", "Tugumukti"]
    },
    "Kabupaten Sumedang": {
      "Sumedang Utara": ["Kota Kaler", "Kebonjati", "Mulyasari", "Paseh", "Rancamulya", "Sirnamulya"],
      "Sumedang Selatan": ["Kota Kulon", "Regol Wetan", "Pasanggrahan", "Sukajaya", "Sukanagara"],
      "Jatinangor": ["Cikeruh", "Cilayung", "Cibeusi", "Cipacing", "Hegarmanah", "Sayang"],
      "Tanjungsari": ["Gudang", "Jatisari", "Margajaya", "Margaluyu", "Rahayu", "Tanjungsari"]
    },
    "Kabupaten Garut": {
      "Garut Kota": ["Cimuncang", "Ciwalen", "Kotakulon", "Kotawetan", "Margawati", "Muara Sanding", "Pakuwon", "Peminggir", "Regol"],
      "Tarogong Kidul": ["Haurpanggung", "Jayaraga", "Jayasari", "Keramat Wangi", "Sukagalih", "Sukajaya", "Sukatani", "Tarogong"],
      "Tarogong Kaler": ["Cimanganten", "Jatilaba", "Mekarjaya", "Panjiwangi", "Rancabango", "Sirnajaya", "Sukajadi"]
    },
    "Kabupaten Bogor": {
      "Cibinong": ["Cibinong", "Cirimekar", "Ciriung", "Harapan Jaya", "Karadenan", "Nanggewer", "Pabuaran", "Sukahati"],
      "Cileungsi": ["Cileungsi", "Cileungsi Kidul", "Cikahuripan", "Dayeuh", "Limus Nunggal", "Pasir Angin"],
      "Ciawi": ["Banjarsari", "Ciawi", "Cileungsi", "Jambuluwuk", "Pandansari", "Teluk Pinang"]
    },
    "Kota Bogor": {
      "Bogor Tengah": ["Babakan", "Babakan Pasar", "Cibogor", "Ciwaringin", "Gudang", "Kebon Kelapa", "Paledang", "Sempur"],
      "Bogor Timur": ["Baranangsiang", "Katulampa", "Sindangrasa", "Sindangbarang", "Tajur"]
    },
    "Kota Depok": {
      "Pancoran Mas": ["Depok", "Depok Jaya", "Mampang", "Pancoran Mas", "Rangkapan Jaya"],
      "Beji": ["Beji", "Beji Timur", "Kemirimuka", "Kukusan", "Pondok Cina", "Tanah Baru"],
      "Cimanggis": ["Curug", "Harjamukti", "Cisalak Pasar", "Mekarsari", "Pasir Gunung Selatan", "Tugu"]
    },
    "Kota Bekasi": {
      "Bekasi Selatan": ["Pekayon Jaya", "Kayuringin Jaya", "Jaka Setia", "Jaka Mulya", "Marga Jaya"],
      "Bekasi Timur": ["Margahayu", "Duren Jaya", "Bekasi Jaya", "Aren Jaya"]
    },
    "Kabupaten Sukabumi": {
      "Palabuhanratu": ["Cikadu", "Citarik", "Jayanti", "Palabuhanratu", "Pasir Suren"],
      "Cisaat": ["Cisaat", "Cibolang Kaler", "Kutamaya", "Nagrak", "Sukamanah"]
    },
    "Kabupaten Cianjur": {
      "Cianjur": ["Babakankaret", "Bojongherang", "Cipendawa", "Mekarsari", "Pamoyanan", "Sayang", "Solokpandan"],
      "Cipanas": ["Batulawang", "Ciloto", "Cipanas", "Cimacan", "Palasari", "Sindanglaya"]
    }
  },
  "DKI Jakarta": {
    "Jakarta Selatan": {
      "Kebayoran Baru": ["Senayan", "Selong", "Rawa Barat", "Melawai", "Gunung", "Kramat Pela"],
      "Cilandak": ["Cilandak Barat", "Lebak Bulus", "Pondok Labu", "Gandaria Selatan"],
      "Pasar Minggu": ["Pejaten Barat", "Pejaten Timur", "Pasar Minggu", "Kebagusan", "Ragunan"]
    },
    "Jakarta Timur": {
      "Jatinegara": ["Bali Mester", "Kampung Melayu", "Bidara Cina", "Cipinang Cempedak"],
      "Duren Sawit": ["Pondok Bambu", "Duren Sawit", "Pondok Kelapa", "Malaka Jaya"]
    }
  },
  "Jawa Tengah": {
    "Kota Semarang": {
      "Semarang Selatan": ["Bulustalan", "Lamper Kidul", "Lamper Tengah", "Peterongan"],
      "Banyumanik": ["Banyumanik", "Pudakpayung", "Srondol Kulon"]
    },
    "Kota Surakarta": {
      "Banjarsari": ["Kadipiro", "Nusukan", "Gilingan", "Manahan"],
      "Jebres": ["Jebres", "Mojosongo", "Sewu"]
    }
  },
  "Jawa Timur": {
    "Kota Surabaya": {
      "Gubeng": ["Gubeng", "Airlangga", "Mojo", "Kertajaya"],
      "Wonokromo": ["Wonokromo", "Darmo", "Jagir"]
    },
    "Kabupaten Malang": {
      "Singosari": ["Candirenggo", "Pagas", "Tutup"],
      "Kepanjen": ["Kepanjen", "Ardirejo", "Penarukan"]
    }
  },
  "Banten": {
    "Kota Tangerang": {
      "Tangerang": ["Cikokol", "Suk interior", "Sukaasih"],
      "Cipondoh": ["Cipondoh", "Cipondoh Indah", "Poris Plawad"]
    },
    "Kota Tangerang Selatan": {
      "Serpong": ["BSD City", "Lengkong Gudang", "Rawa Buntu"],
      "Pondok Aren": ["Bintaro", "Pondok Betung", "Jurang Mangu"]
    }
  }
};
