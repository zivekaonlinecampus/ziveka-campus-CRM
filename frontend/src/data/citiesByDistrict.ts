export interface CityOption {
  name: string;
  name_si: string;
}

export const citiesByDistrictCode: Record<string, CityOption[]> = {
  CMB: [
    { name: 'Colombo 1 - Fort', name_si: 'කොළඹ 1 - කොටුව' },
    { name: 'Colombo 2 - Slave Island', name_si: 'කොළඹ 2 - කොම්පඤ්ඤ වීදිය' },
    { name: 'Colombo 3 - Kollupitiya', name_si: 'කොළඹ 3 - කොල්ලුපිටිය' },
    { name: 'Colombo 4 - Bambalapitiya', name_si: 'කොළඹ 4 - බම්බලපිටිය' },
    { name: 'Colombo 5 - Havelock Town', name_si: 'කොළඹ 5 - හැව්ලොක් ටවුන්' },
    { name: 'Colombo 6 - Wellawatte', name_si: 'කොළඹ 6 - වැල්ලවත්ත' },
    { name: 'Colombo 7 - Cinnamon Gardens', name_si: 'කොළඹ 7 - කුරුඳුවත්ත' },
    { name: 'Colombo 8 - Borella', name_si: 'කොළඹ 8 - බොරැල්ල' },
    { name: 'Colombo 9 - Dematagoda', name_si: 'කොළඹ 9 - දෙමටගොඩ' },
    { name: 'Colombo 10 - Maradana', name_si: 'කොළඹ 10 - මරදාන' },
    { name: 'Colombo 11 - Pettah', name_si: 'කොළඹ 11 - පිටකොටුව' },
    { name: 'Colombo 12 - Hulftsdorp', name_si: 'කොළඹ 12 - අළුත්කඩේ' },
    { name: 'Colombo 13 - Kotahena', name_si: 'කොළඹ 13 - කොටහේන' },
    { name: 'Colombo 14 - Grandpass', name_si: 'කොළඹ 14 - ග්‍රෑන්ඩ්පාස්' },
    { name: 'Colombo 15 - Mutwal', name_si: 'කොළඹ 15 - මට්ටක්කුලිය' },
    { name: 'Dehiwala-Mount Lavinia', name_si: 'දෙහිවල-ගල්කිස්ස' },
    { name: 'Maharagama', name_si: 'මහරගම' },
    { name: 'Moratuwa', name_si: 'මොරටුව' },
    { name: 'Sri Jayawardenepura Kotte', name_si: 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ' },
    { name: 'Kaduwela', name_si: 'කඩුවෙල' },
    { name: 'Homagama', name_si: 'හෝමාගම' },
    { name: 'Kesbewa', name_si: 'කැස්බෑව' },
    { name: 'Kolonnawa', name_si: 'කොලොන්නාව' },
    { name: 'Padukka', name_si: 'පාදුක්ක' },
  ],
  GAM: [
    { name: 'Gampaha', name_si: 'ගම්පහ' }, { name: 'Negombo', name_si: 'මීගමුව' }, { name: 'Ja-Ela', name_si: 'ජා-ඇල' },
    { name: 'Wattala', name_si: 'වත්තල' }, { name: 'Kelaniya', name_si: 'කැලණිය' }, { name: 'Minuwangoda', name_si: 'මිනුවන්ගොඩ' },
    { name: 'Katunayake', name_si: 'කටුනායක' }, { name: 'Divulapitiya', name_si: 'දිවුලපිටිය' }, { name: 'Nittambuwa', name_si: 'නිට්ටඹුව' },
    { name: 'Kiribathgoda', name_si: 'කිරිබත්ගොඩ' }, { name: 'Veyangoda', name_si: 'වේයන්ගොඩ' },
  ],
  KAL: [
    { name: 'Kalutara', name_si: 'කළුතර' }, { name: 'Panadura', name_si: 'පානදුර' }, { name: 'Beruwala', name_si: 'බේරුවල' },
    { name: 'Horana', name_si: 'හොරණ' }, { name: 'Wadduwa', name_si: 'වාද්දුව' }, { name: 'Aluthgama', name_si: 'අලුත්ගම' },
    { name: 'Matugama', name_si: 'මතුගම' }, { name: 'Bandaragama', name_si: 'බණ්ඩාරගම' },
  ],
  KAN: [
    { name: 'Kandy', name_si: 'මහනුවර' }, { name: 'Gampola', name_si: 'ගම්පොළ' }, { name: 'Katugastota', name_si: 'කටුගස්තොට' },
    { name: 'Peradeniya', name_si: 'පේරාදෙණිය' }, { name: 'Nawalapitiya', name_si: 'නාවලපිටිය' }, { name: 'Wattegama', name_si: 'වත්තේගම' },
    { name: 'Kadugannawa', name_si: 'කඩුගන්නාව' }, { name: 'Teldeniya', name_si: 'තෙල්දෙණිය' },
  ],
  MTL: [
    { name: 'Matale', name_si: 'මාතලේ' }, { name: 'Dambulla', name_si: 'දඹුල්ල' }, { name: 'Galewela', name_si: 'ගලේවෙල' },
    { name: 'Ukuwela', name_si: 'උකුවෙල' }, { name: 'Rattota', name_si: 'රත්තොට' },
  ],
  NEL: [
    { name: 'Nuwara Eliya', name_si: 'නුවරඑළිය' }, { name: 'Hatton', name_si: 'හැටන්' }, { name: 'Talawakele', name_si: 'තලවකැලේ' },
    { name: 'Nanu Oya', name_si: 'නානුඔය' }, { name: 'Walapane', name_si: 'වලපනේ' }, { name: 'Ginigathhena', name_si: 'ගිනිගත්හේන' },
  ],
  GAL: [
    { name: 'Galle', name_si: 'ගාල්ල' }, { name: 'Ambalangoda', name_si: 'අම්බලන්ගොඩ' }, { name: 'Hikkaduwa', name_si: 'හික්කඩුව' },
    { name: 'Elpitiya', name_si: 'ඇල්පිටිය' }, { name: 'Ahangama', name_si: 'අහංගම' }, { name: 'Baddegama', name_si: 'බද්දේගම' },
    { name: 'Bentota', name_si: 'බෙන්තොට' },
  ],
  MAT: [
    { name: 'Matara', name_si: 'මාතර' }, { name: 'Weligama', name_si: 'වැලිගම' }, { name: 'Akuressa', name_si: 'අකුරැස්ස' },
    { name: 'Dikwella', name_si: 'දික්වැල්ල' }, { name: 'Kamburupitiya', name_si: 'කඹුරුපිටිය' }, { name: 'Deniyaya', name_si: 'දෙනියාය' },
  ],
  HAM: [
    { name: 'Hambantota', name_si: 'හම්බන්තොට' }, { name: 'Tangalle', name_si: 'තංගල්ල' }, { name: 'Tissamaharama', name_si: 'තිස්සමහාරාමය' },
    { name: 'Beliatta', name_si: 'බෙලිඅත්ත' }, { name: 'Ambalantota', name_si: 'අම්බලන්තොට' },
  ],
  JAF: [
    { name: 'Jaffna', name_si: 'යාපනය' }, { name: 'Chavakachcheri', name_si: 'චාවකච්චේරි' }, { name: 'Point Pedro', name_si: 'පේදුරුතුඩුව' },
    { name: 'Nallur', name_si: 'නල්ලූර්' }, { name: 'Karainagar', name_si: 'කරෙයිනගර්' },
  ],
  KIL: [{ name: 'Kilinochchi', name_si: 'කිලිනොච්චි' }, { name: 'Pallai', name_si: 'පලෙයි' }, { name: 'Poonakary', name_si: 'පූනකරි' }],
  MAN: [{ name: 'Mannar', name_si: 'මන්නාරම' }, { name: 'Pesalai', name_si: 'පේසාලේ' }, { name: 'Murunkan', name_si: 'මුරුන්කන්' }],
  VAV: [{ name: 'Vavuniya', name_si: 'වවුනියාව' }, { name: 'Nedunkeni', name_si: 'නෙඩුන්කේනි' }, { name: 'Settikulam', name_si: 'සෙට්ටිකුලම' }],
  MUL: [{ name: 'Mullaitivu', name_si: 'මුලතිව්' }, { name: 'Puthukkudiyiruppu', name_si: 'පුදුකුඩිඉරිප්පු' }, { name: 'Oddusuddan', name_si: 'ඔඩ්ඩුසුඩාන්' }],
  BAT: [{ name: 'Batticaloa', name_si: 'මඩකලපුව' }, { name: 'Kattankudy', name_si: 'කාත්තන්කුඩි' }, { name: 'Eravur', name_si: 'එරාවුර්' }, { name: 'Valachchenai', name_si: 'වාලච්චේන' }],
  AMP: [{ name: 'Ampara', name_si: 'අම්පාර' }, { name: 'Kalmunai', name_si: 'කල්මුණේ' }, { name: 'Akkaraipattu', name_si: 'අක්කරපත්තුව' }, { name: 'Sainthamaruthu', name_si: 'සායින්දමරුදු' }, { name: 'Sammanthurai', name_si: 'සම්මාන්තුරෙයි' }],
  TRI: [{ name: 'Trincomalee', name_si: 'ත්‍රිකුණාමලය' }, { name: 'Kinniya', name_si: 'කින්නියා' }, { name: 'Kantale', name_si: 'කන්තලේ' }, { name: 'Muttur', name_si: 'මුතූර්' }],
  KUR: [{ name: 'Kurunegala', name_si: 'කුරුණෑගල' }, { name: 'Kuliyapitiya', name_si: 'කුලියාපිටිය' }, { name: 'Nikaweratiya', name_si: 'නිකවැරටිය' }, { name: 'Dambadeniya', name_si: 'දඹදෙණිය' }, { name: 'Wariyapola', name_si: 'වාරියපොළ' }, { name: 'Narammala', name_si: 'නාරම්මල' }],
  PUT: [{ name: 'Puttalam', name_si: 'පුත්තලම' }, { name: 'Chilaw', name_si: 'හලාවත' }, { name: 'Wennappuwa', name_si: 'වෙන්නප්පුව' }, { name: 'Marawila', name_si: 'මාරවිල' }, { name: 'Dankotuwa', name_si: 'දංකොටුව' }],
  ANU: [{ name: 'Anuradhapura', name_si: 'අනුරාධපුරය' }, { name: 'Kekirawa', name_si: 'කැකිරාව' }, { name: 'Medawachchiya', name_si: 'මැදවච්චිය' }, { name: 'Eppawala', name_si: 'එප්පාවල' }, { name: 'Tambuttegama', name_si: 'තඹුත්තේගම' }],
  POL: [{ name: 'Polonnaruwa', name_si: 'පොළොන්නරුව' }, { name: 'Kaduruwela', name_si: 'කඳුරුවෙල' }, { name: 'Medirigiriya', name_si: 'මැදිරිගිරිය' }, { name: 'Hingurakgoda', name_si: 'හිඟුරක්ගොඩ' }],
  BAD: [{ name: 'Badulla', name_si: 'බදුල්ල' }, { name: 'Bandarawela', name_si: 'බණ්ඩාරවෙල' }, { name: 'Haputale', name_si: 'හපුතලේ' }, { name: 'Mahiyanganaya', name_si: 'මහියංගනය' }, { name: 'Welimada', name_si: 'වැලිමඩ' }, { name: 'Ella', name_si: 'ඇල්ල' }],
  MON: [{ name: 'Monaragala', name_si: 'මොණරාගල' }, { name: 'Wellawaya', name_si: 'වැල්ලවාය' }, { name: 'Bibile', name_si: 'බිබිල' }, { name: 'Buttala', name_si: 'බුත්තල' }, { name: 'Siyambalanduwa', name_si: 'සියඹලාණ්ඩුව' }],
  RAT: [{ name: 'Ratnapura', name_si: 'රත්නපුර' }, { name: 'Balangoda', name_si: 'බලංගොඩ' }, { name: 'Embilipitiya', name_si: 'ඇඹිලිපිටිය' }, { name: 'Pelmadulla', name_si: 'පැල්මඩුල්ල' }, { name: 'Eheliyagoda', name_si: 'ඇහැලියගොඩ' }],
  KEG: [{ name: 'Kegalle', name_si: 'කෑගල්ල' }, { name: 'Mawanella', name_si: 'මාවනැල්ල' }, { name: 'Rambukkana', name_si: 'රඹුක්කන' }, { name: 'Warakapola', name_si: 'වරකාපොල' }, { name: 'Avissawella', name_si: 'අවිස්සාවේල්ල' }],
};