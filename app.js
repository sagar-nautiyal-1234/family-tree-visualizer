(() => {
"use strict";

/*
  NOTE ON PERSISTENCE
  --------------------
  This build keeps the tree in memory only (no localStorage). That's a
  deliberate choice: if this page is ever opened inside an embedded / sandboxed
  preview (including Claude's own artifact preview), storage APIs are blocked
  or silently fail there, which used to make "saved" data vanish without
  warning. If you're hosting this yourself and want autosave back, it's a
  two-function change:
    1. At the end of any state-mutating function (addRoot, addChild,
       editPerson, deletePerson, reset, importTree, and the design slider
       handler) call `saveState()`.
    2. In the init block at the bottom, call `loadState()` and only fall back
       to the demo data if it returns false.
  Both functions are defined below (see saveState/loadState) but unused by
  default — flip STORAGE_ENABLED to true to wire them back in.
*/
const STORAGE_ENABLED = false;
const STORAGE_KEY = "family_tree_data_v2";

const T = {
en:{appTitle:"Family Tree",appSubtitle:"Visualizer",searchSection:"Search",searchPlaceholder:"Search person...",treeSection:"Tree",addRoot:"Add Root",reset:"Reset",selectedSection:"Selected Person",none:"None selected",clickPerson:"Click a person in the tree.",addChild:"Add Child",edit:"Edit",delete:"Delete Person",designSection:"Design",width:"Card Width",spacing:"Child Spacing",generation:"Generation Spacing",language:"Language",languageLabel:"Interface Language",data:"Data",export:"Export",import:"Import",beta:"Beta",about:"Create roots, children, edit names, delete branches, customize spacing, change language, and export/import the tree.",root:"Root",member:"Family member",children:"Children",selectFirst:"Select a person first.",namePrompt:"Enter the person's name:",childPrompt:"Enter the child's name:",editPrompt:"Edit name:",deleteConfirm:"Delete",branchWarning:"This person has descendants. Deleting them will delete the entire branch.",emptyTitle:"Your family tree is empty",emptyText:'Click "Add Root" to create the first person.',invalid:"Invalid family tree file.",invalidCycle:"That file has a broken family link (a loop) and can't be opened.",imported:"Family tree imported.",exported:"Family tree exported.",resetConfirm:"Delete the entire family tree?",saved:"Changes applied.",cancel:"Cancel",confirm:"Confirm"},
hi:{appTitle:"वंश वृक्ष",appSubtitle:"विज़ुअलाइज़र",searchSection:"खोज",searchPlaceholder:"व्यक्ति खोजें...",treeSection:"वृक्ष",addRoot:"मूल जोड़ें",reset:"रीसेट",selectedSection:"चयनित व्यक्ति",none:"कोई चयन नहीं",clickPerson:"वृक्ष में किसी व्यक्ति पर क्लिक करें।",addChild:"संतान जोड़ें",edit:"संपादित करें",delete:"व्यक्ति हटाएँ",designSection:"डिज़ाइन",width:"कार्ड चौड़ाई",spacing:"संतान दूरी",generation:"पीढ़ी दूरी",language:"भाषा",languageLabel:"इंटरफ़ेस भाषा",data:"डेटा",export:"निर्यात",import:"आयात",beta:"बीटा",about:"मूल व्यक्ति और संतान जोड़ें, नाम संपादित करें, शाखाएँ हटाएँ, दूरी बदलें, भाषा बदलें और डेटा निर्यात/आयात करें।",root:"मूल",member:"परिवार सदस्य",children:"संतान",selectFirst:"पहले किसी व्यक्ति को चुनें।",namePrompt:"व्यक्ति का नाम दर्ज करें:",childPrompt:"संतान का नाम दर्ज करें:",editPrompt:"नाम संपादित करें:",deleteConfirm:"हटाएँ",branchWarning:"इस व्यक्ति के वंशज हैं। हटाने पर पूरी शाखा हट जाएगी।",emptyTitle:"आपका वंश वृक्ष खाली है",emptyText:"पहला व्यक्ति जोड़ने के लिए “मूल जोड़ें” दबाएँ।",invalid:"अमान्य वंश वृक्ष फ़ाइल।",invalidCycle:"इस फ़ाइल में एक टूटा हुआ पारिवारिक संबंध (लूप) है, इसे खोला नहीं जा सकता।",imported:"वंश वृक्ष आयात हो गया।",exported:"वंश वृक्ष निर्यात हो गया।",resetConfirm:"पूरा वंश वृक्ष हटाएँ?",saved:"परिवर्तन लागू हो गए।",cancel:"रद्द करें",confirm:"पुष्टि करें"},
ne:{appTitle:"वंश वृक्ष",appSubtitle:"भिजुअलाइजर",searchSection:"खोज",searchPlaceholder:"व्यक्ति खोज्नुहोस्...",treeSection:"वृक्ष",addRoot:"मूल थप्नुहोस्",reset:"रिसेट",selectedSection:"छानिएको व्यक्ति",none:"कुनै चयन छैन",clickPerson:"वृक्षमा कुनै व्यक्तिलाई क्लिक गर्नुहोस्।",addChild:"सन्तान थप्नुहोस्",edit:"सम्पादन",delete:"व्यक्ति हटाउनुहोस्",designSection:"डिजाइन",width:"कार्ड चौडाइ",spacing:"सन्तान दूरी",generation:"पुस्ता दूरी",language:"भाषा",languageLabel:"इन्टरफेस भाषा",data:"डेटा",export:"निर्यात",import:"आयात",beta:"बीटा",about:"मूल व्यक्ति र सन्तान थप्नुहोस्, नाम सम्पादन गर्नुहोस्, शाखा हटाउनुहोस्, दूरी परिवर्तन गर्नुहोस् र डेटा आयात/निर्यात गर्नुहोस्।",root:"मूल",member:"परिवार सदस्य",children:"सन्तान",selectFirst:"पहिले व्यक्ति छान्नुहोस्।",namePrompt:"व्यक्तिको नाम लेख्नुहोस्:",childPrompt:"सन्तानको नाम लेख्नुहोस्:",editPrompt:"नाम सम्पादन गर्नुहोस्:",deleteConfirm:"हटाउने?",branchWarning:"यस व्यक्तिका वंशज छन्। हटाउँदा पूरा शाखा हट्नेछ।",emptyTitle:"तपाईंको वंश वृक्ष खाली छ",emptyText:"पहिलो व्यक्ति थप्न “मूल थप्नुहोस्” क्लिक गर्नुहोस्।",invalid:"अमान्य वंश वृक्ष फाइल।",invalidCycle:"यो फाइलमा टुटेको पारिवारिक सम्बन्ध (लूप) छ, यसलाई खोल्न सकिँदैन।",imported:"वंश वृक्ष आयात भयो।",exported:"वंश वृक्ष निर्यात भयो।",resetConfirm:"पूरै वंश वृक्ष हटाउने?",saved:"परिवर्तन लागू भयो।",cancel:"रद्द",confirm:"पुष्टि"},
bn:{appTitle:"পারিবারিক বৃক্ষ",appSubtitle:"ভিজ্যুয়ালাইজার",searchSection:"অনুসন্ধান",searchPlaceholder:"ব্যক্তি খুঁজুন...",treeSection:"বৃক্ষ",addRoot:"মূল যোগ করুন",reset:"রিসেট",selectedSection:"নির্বাচিত ব্যক্তি",none:"কেউ নির্বাচিত নয়",clickPerson:"বৃক্ষে একজন ব্যক্তিকে ক্লিক করুন।",addChild:"সন্তান যোগ করুন",edit:"সম্পাদনা",delete:"ব্যক্তি মুছুন",designSection:"ডিজাইন",width:"কার্ডের প্রস্থ",spacing:"সন্তানের দূরত্ব",generation:"প্রজন্মের দূরত্ব",language:"ভাষা",languageLabel:"ইন্টারফেস ভাষা",data:"ডেটা",export:"রপ্তানি",import:"আমদানি",beta:"বিটা",about:"মূল ব্যক্তি ও সন্তান যোগ করুন, নাম সম্পাদনা করুন, শাখা মুছুন, দূরত্ব বদলান এবং ডেটা রপ্তানি/আমদানি করুন।",root:"মূল",member:"পরিবারের সদস্য",children:"সন্তান",selectFirst:"প্রথমে একজন ব্যক্তিকে নির্বাচন করুন।",namePrompt:"ব্যক্তির নাম লিখুন:",childPrompt:"সন্তানের নাম লিখুন:",editPrompt:"নাম সম্পাদনা করুন:",deleteConfirm:"মুছবেন",branchWarning:"এই ব্যক্তির বংশধর আছে। মুছলে পুরো শাখা মুছে যাবে।",emptyTitle:"আপনার পারিবারিক বৃক্ষ খালি",emptyText:"প্রথম ব্যক্তি যোগ করতে “মূল যোগ করুন” চাপুন।",invalid:"অবৈধ পারিবারিক বৃক্ষ ফাইল।",invalidCycle:"এই ফাইলে একটি ভাঙা পারিবারিক সম্পর্ক (লুপ) আছে, এটি খোলা যাচ্ছে না।",imported:"পারিবারিক বৃক্ষ আমদানি হয়েছে।",exported:"পারিবারিক বৃক্ষ রপ্তানি হয়েছে।",resetConfirm:"পুরো পারিবারিক বৃক্ষ মুছবেন?",saved:"পরিবর্তন প্রয়োগ হয়েছে।",cancel:"বাতিল",confirm:"নিশ্চিত করুন"},
mr:{appTitle:"कौटुंबिक वृक्ष",appSubtitle:"व्हिज्युअलायझर",searchSection:"शोधा",searchPlaceholder:"व्यक्ती शोधा...",treeSection:"वृक्ष",addRoot:"मूळ व्यक्ती जोडा",reset:"रीसेट",selectedSection:"निवडलेली व्यक्ती",none:"कोणीही निवडलेले नाही",clickPerson:"वृक्षातील व्यक्तीवर क्लिक करा.",addChild:"मूल जोडा",edit:"संपादित करा",delete:"व्यक्ती हटवा",designSection:"डिझाइन",width:"कार्ड रुंदी",spacing:"मुलांमधील अंतर",generation:"पिढ्यांमधील अंतर",language:"भाषा",languageLabel:"इंटरफेस भाषा",data:"डेटा",export:"निर्यात",import:"आयात",beta:"बीटा",about:"मूळ व्यक्ती व मुले जोडा, नावे संपादित करा, शाखा हटवा, अंतर बदला आणि डेटा निर्यात/आयात करा.",root:"मूळ",member:"कुटुंबातील सदस्य",children:"मुले",selectFirst:"प्रथम व्यक्ती निवडा.",namePrompt:"व्यक्तीचे नाव लिहा:",childPrompt:"मुलाचे नाव लिहा:",editPrompt:"नाव संपादित करा:",deleteConfirm:"हटवायचे?",branchWarning:"या व्यक्तीचे वंशज आहेत. हटवल्यास संपूर्ण शाखा हटेल.",emptyTitle:"तुमचा कौटुंबिक वृक्ष रिकामा आहे",emptyText:"पहिली व्यक्ती जोडण्यासाठी “मूळ व्यक्ती जोडा” क्लिक करा.",invalid:"अवैध कौटुंबिक वृक्ष फाइल.",invalidCycle:"या फाइलमध्ये तुटलेले कौटुंबिक नाते (लूप) आहे, ती उघडता येत नाही.",imported:"कौटुंबिक वृक्ष आयात झाला.",exported:"कौटुंबिक वृक्ष निर्यात झाला.",resetConfirm:"संपूर्ण कौटुंबिक वृक्ष हटवायचा?",saved:"बदल लागू झाले.",cancel:"रद्द करा",confirm:"निश्चित करा"},
ta:{appTitle:"குடும்ப மரம்",appSubtitle:"காட்சிப்படுத்தி",searchSection:"தேடல்",searchPlaceholder:"நபரைத் தேடு...",treeSection:"மரம்",addRoot:"மூல நபரைச் சேர்க்கவும்",reset:"மீட்டமை",selectedSection:"தேர்ந்தெடுக்கப்பட்ட நபர்",none:"யாரும் தேர்ந்தெடுக்கப்படவில்லை",clickPerson:"மரத்தில் ஒருவரைக் கிளிக் செய்யவும்.",addChild:"குழந்தையைச் சேர்க்கவும்",edit:"திருத்து",delete:"நபரை நீக்கு",designSection:"வடிவமைப்பு",width:"அட்டை அகலம்",spacing:"குழந்தைகளின் இடைவெளி",generation:"தலைமுறை இடைவெளி",language:"மொழி",languageLabel:"இடைமுக மொழி",data:"தரவு",export:"ஏற்றுமதி",import:"இறக்குமதி",beta:"பீட்டா",about:"மூல நபர்கள் மற்றும் குழந்தைகளைச் சேர்க்கவும், பெயர்களைத் திருத்தவும், கிளைகளை நீக்கவும், இடைவெளியை மாற்றவும், தரவை இறக்குமதி/ஏற்றுமதி செய்யவும்.",root:"மூல நபர்",member:"குடும்ப உறுப்பினர்",children:"குழந்தைகள்",selectFirst:"முதலில் ஒரு நபரைத் தேர்ந்தெடுக்கவும்.",namePrompt:"நபரின் பெயரை உள்ளிடவும்:",childPrompt:"குழந்தையின் பெயரை உள்ளிடவும்:",editPrompt:"பெயரைத் திருத்தவும்:",deleteConfirm:"நீக்கவா",branchWarning:"இந்த நபருக்கு சந்ததிகள் உள்ளனர். நீக்கினால் முழு கிளையும் நீக்கப்படும்.",emptyTitle:"உங்கள் குடும்ப மரம் காலியாக உள்ளது",emptyText:"முதல் நபரைச் சேர்க்க “மூல நபரைச் சேர்க்கவும்” என்பதைக் கிளிக் செய்யவும்.",invalid:"தவறான குடும்ப மரக் கோப்பு.",invalidCycle:"இந்தக் கோப்பில் உடைந்த குடும்ப தொடர்பு (லூப்) உள்ளது, இதைத் திறக்க முடியாது.",imported:"குடும்ப மரம் இறக்குமதி செய்யப்பட்டது.",exported:"குடும்ப மரம் ஏற்றுமதி செய்யப்பட்டது.",resetConfirm:"முழு குடும்ப மரத்தையும் நீக்கவா?",saved:"மாற்றங்கள் பயன்படுத்தப்பட்டன.",cancel:"ரத்துசெய்",confirm:"உறுதிசெய்"},
te:{appTitle:"కుటుంబ వృక్షం",appSubtitle:"విజువలైజర్",searchSection:"శోధన",searchPlaceholder:"వ్యక్తిని శోధించండి...",treeSection:"వృక్షం",addRoot:"మూల వ్యక్తిని జోడించండి",reset:"రీసెట్",selectedSection:"ఎంచుకున్న వ్యక్తి",none:"ఎవరూ ఎంచుకోలేదు",clickPerson:"వృక్షంలోని వ్యక్తిని క్లిక్ చేయండి.",addChild:"సంతానాన్ని జోడించండి",edit:"సవరించండి",delete:"వ్యక్తిని తొలగించండి",designSection:"డిజైన్",width:"కార్డ్ వెడల్పు",spacing:"సంతానం మధ్య దూరం",generation:"తరాల మధ్య దూరం",language:"భాష",languageLabel:"ఇంటర్‌ఫేస్ భాష",data:"డేటా",export:"ఎగుమతి",import:"దిగుమతి",beta:"బీటా",about:"మూల వ్యక్తులు మరియు సంతానాన్ని జోడించండి, పేర్లు సవరించండి, శాఖలు తొలగించండి, దూరాలను మార్చండి మరియు డేటాను దిగుమతి/ఎగుమతి చేయండి.",root:"మూల వ్యక్తి",member:"కుటుంబ సభ్యుడు",children:"సంతానం",selectFirst:"ముందుగా ఒక వ్యక్తిని ఎంచుకోండి.",namePrompt:"వ్యక్తి పేరు నమోదు చేయండి:",childPrompt:"సంతానం పేరు నమోదు చేయండి:",editPrompt:"పేరు సవరించండి:",deleteConfirm:"తొలగించాలా",branchWarning:"ఈ వ్యక్తికి వారసులు ఉన్నారు. తొలగిస్తే మొత్తం శాఖ తొలగిపోతుంది.",emptyTitle:"మీ కుటుంబ వృక్షం ఖాళీగా ఉంది",emptyText:"మొదటి వ్యక్తిని జోడించడానికి “మూల వ్యక్తిని జోడించండి” క్లిక్ చేయండి.",invalid:"చెల్లని కుటుంబ వృక్ష ఫైల్.",invalidCycle:"ఈ ఫైల్‌లో విరిగిన కుటుంబ లింక్ (లూప్) ఉంది, దీన్ని తెరవడం సాధ్యం కాదు.",imported:"కుటుంబ వృక్షం దిగుమతి చేయబడింది.",exported:"కుటుంబ వృక్షం ఎగుమతి చేయబడింది.",resetConfirm:"మొత్తం కుటుంబ వృక్షాన్ని తొలగించాలా?",saved:"మార్పులు వర్తించాయి.",cancel:"రద్దు",confirm:"స్థిరీకరించు"},
gu:{appTitle:"કુટુંબ વૃક્ષ",appSubtitle:"વિઝ્યુઅલાઇઝર",searchSection:"શોધ",searchPlaceholder:"વ્યક્તિ શોધો...",treeSection:"વૃક્ષ",addRoot:"મૂળ વ્યક્તિ ઉમેરો",reset:"રીસેટ",selectedSection:"પસંદ કરેલ વ્યક્તિ",none:"કોઈ પસંદગી નથી",clickPerson:"વૃક્ષમાં વ્યક્તિ પર ક્લિક કરો.",addChild:"સંતાન ઉમેરો",edit:"ફેરફાર કરો",delete:"વ્યક્તિ કાઢી નાખો",designSection:"ડિઝાઇન",width:"કાર્ડ પહોળાઈ",spacing:"સંતાન વચ્ચેનું અંતર",generation:"પેઢી વચ્ચેનું અંતર",language:"ભાષા",languageLabel:"ઇન્ટરફેસ ભાષા",data:"ડેટા",export:"નિકાસ",import:"આયાત",beta:"બીટા",about:"મૂળ વ્યક્તિ અને સંતાન ઉમેરો, નામ ફેરફાર કરો, શાખાઓ કાઢી નાખો, અંતર બદલો અને ડેટા આયાત/નિકાસ કરો.",root:"મૂળ",member:"કુટુંબ સભ્ય",children:"સંતાન",selectFirst:"પહેલા વ્યક્તિ પસંદ કરો.",namePrompt:"વ્યક્તિનું નામ લખો:",childPrompt:"સંતાનનું નામ લખો:",editPrompt:"નામ ફેરફાર કરો:",deleteConfirm:"કાઢી નાખવું?",branchWarning:"આ વ્યક્તિના વંશજો છે. કાઢી નાખવાથી આખી શાખા કાઢી નાખવામાં આવશે.",emptyTitle:"તમારું કુટુંબ વૃક્ષ ખાલી છે",emptyText:"પ્રથમ વ્યક્તિ ઉમેરવા “મૂળ વ્યક્તિ ઉમેરો” ક્લિક કરો.",invalid:"અમાન્ય કુટુંબ વૃક્ષ ફાઇલ.",invalidCycle:"આ ફાઇલમાં તૂટેલો કૌટુંબિક સંબંધ (લૂપ) છે, તે ખોલી શકાતી નથી.",imported:"કુટુંબ વૃક્ષ આયાત થયું.",exported:"કુટુંબ વૃક્ષ નિકાસ થયું.",resetConfirm:"આખું કુટુંબ વૃક્ષ કાઢી નાખવું?",saved:"ફેરફારો લાગુ થયા.",cancel:"રદ કરો",confirm:"પુષ્ટિ કરો"},
pa:{appTitle:"ਪਰਿਵਾਰਕ ਰੁੱਖ",appSubtitle:"ਵਿਜ਼ੁਅਲਾਈਜ਼ਰ",searchSection:"ਖੋਜ",searchPlaceholder:"ਵਿਅਕਤੀ ਖੋਜੋ...",treeSection:"ਰੁੱਖ",addRoot:"ਮੂਲ ਵਿਅਕਤੀ ਜੋੜੋ",reset:"ਰੀਸੈੱਟ",selectedSection:"ਚੁਣਿਆ ਵਿਅਕਤੀ",none:"ਕੋਈ ਚੋਣ ਨਹੀਂ",clickPerson:"ਰੁੱਖ ਵਿੱਚ ਕਿਸੇ ਵਿਅਕਤੀ ਨੂੰ ਕਲਿੱਕ ਕਰੋ।",addChild:"ਬੱਚਾ ਜੋੜੋ",edit:"ਸੋਧੋ",delete:"ਵਿਅਕਤੀ ਮਿਟਾਓ",designSection:"ਡਿਜ਼ਾਈਨ",width:"ਕਾਰਡ ਚੌੜਾਈ",spacing:"ਬੱਚਿਆਂ ਵਿਚਕਾਰ ਦੂਰੀ",generation:"ਪੀੜ੍ਹੀ ਵਿਚਕਾਰ ਦੂਰੀ",language:"ਭਾਸ਼ਾ",languageLabel:"ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ",data:"ਡਾਟਾ",export:"ਐਕਸਪੋਰਟ",import:"ਇੰਪੋਰਟ",beta:"ਬੀਟਾ",about:"ਮੂਲ ਵਿਅਕਤੀ ਅਤੇ ਬੱਚੇ ਜੋੜੋ, ਨਾਮ ਸੋਧੋ, ਸ਼ਾਖਾਵਾਂ ਮਿਟਾਓ, ਦੂਰੀ ਬਦਲੋ ਅਤੇ ਡਾਟਾ ਐਕਸਪੋਰਟ/ਇੰਪੋਰਟ ਕਰੋ।",root:"ਮੂਲ",member:"ਪਰਿਵਾਰਕ ਮੈਂਬਰ",children:"ਬੱਚੇ",selectFirst:"ਪਹਿਲਾਂ ਵਿਅਕਤੀ ਚੁਣੋ।",namePrompt:"ਵਿਅਕਤੀ ਦਾ ਨਾਮ ਲਿਖੋ:",childPrompt:"ਬੱਚੇ ਦਾ ਨਾਮ ਲਿਖੋ:",editPrompt:"ਨਾਮ ਸੋਧੋ:",deleteConfirm:"ਮਿਟਾਉਣਾ ਹੈ?",branchWarning:"ਇਸ ਵਿਅਕਤੀ ਦੇ ਵੰਸ਼ਜ ਹਨ। ਮਿਟਾਉਣ ਨਾਲ ਪੂਰੀ ਸ਼ਾਖਾ ਮਿਟ ਜਾਵੇਗੀ।",emptyTitle:"ਤੁਹਾਡਾ ਪਰਿਵਾਰਕ ਰੁੱਖ ਖਾਲੀ ਹੈ",emptyText:"ਪਹਿਲਾ ਵਿਅਕਤੀ ਜੋੜਨ ਲਈ “ਮੂਲ ਵਿਅਕਤੀ ਜੋੜੋ” ਕਲਿੱਕ ਕਰੋ।",invalid:"ਅਵੈਧ ਪਰਿਵਾਰਕ ਰੁੱਖ ਫਾਈਲ।",invalidCycle:"ਇਸ ਫਾਈਲ ਵਿੱਚ ਇੱਕ ਟੁੱਟਿਆ ਪਰਿਵਾਰਕ ਸਬੰਧ (ਲੂਪ) ਹੈ, ਇਸਨੂੰ ਖੋਲ੍ਹਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ।",imported:"ਪਰਿਵਾਰਕ ਰੁੱਖ ਇੰਪੋਰਟ ਹੋ ਗਿਆ।",exported:"ਪਰਿਵਾਰਕ ਰੁੱਖ ਐਕਸਪੋਰਟ ਹੋ ਗਿਆ।",resetConfirm:"ਪੂਰਾ ਪਰਿਵਾਰਕ ਰੁੱਖ ਮਿਟਾਉਣਾ ਹੈ?",saved:"ਤਬਦੀਲੀਆਂ ਲਾਗੂ ਹੋ ਗਈਆਂ।",cancel:"ਰੱਦ ਕਰੋ",confirm:"ਪੁਸ਼ਟੀ ਕਰੋ"}
};

const MAX_NAME_LENGTH = 80;

let lang = "en", people = [], selectedId = null, nextId = 1, zoom = 1, searchQuery = "";
let panX = 0, panY = 0, isDragging = false, startX = 0, startY = 0;
let initialPinchDist = null, initialZoom = 1;

const $ = id => document.getElementById(id);
const t = k => (T[lang] && T[lang][k]) || T.en[k] || k;

function esc(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function get(id) { return people.find(p => p.id === id); }
function children(id) { return people.filter(p => p.parentId === id); }
function roots() { return people.filter(p => p.parentId === null); }

function toast(msg) {
  const e = $("toast"); e.textContent = msg; e.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => e.classList.remove("show"), 1800);
}

// Optional localStorage persistence — off by default, see the note at the
// top of this file for how to enable it.
function saveState() {
  if (!STORAGE_ENABLED) return;
  const data = { version: 2, nextId, people, design: { cardWidth: $("cardWidth").value, spacing: $("spacing").value, generation: $("generation").value } };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable in this context */ }
}

function loadState() {
  if (!STORAGE_ENABLED) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d && Array.isArray(d.people)) {
      const normalized = normalizePeople(d.people);
      if (!normalized) return false;
      people = normalized;
      nextId = d.nextId || Math.max(0, ...people.map(p => p.id)) + 1;
      if (d.design) {
        if (d.design.cardWidth) $("cardWidth").value = d.design.cardWidth;
        if (d.design.spacing) $("spacing").value = d.design.spacing;
        if (d.design.generation) $("generation").value = d.design.generation;
      }
      return true;
    }
  } catch (e) { console.error(e); }
  return false;
}

// Custom Modal System
function showModal({ title, body, defaultValue = "", isPrompt = true }) {
  return new Promise((resolve) => {
    const overlay = $("modalOverlay");
    const titleEl = $("modalTitle");
    const bodyEl = $("modalBody");
    const confirmBtn = $("modalConfirm");
    const cancelBtn = $("modalCancel");

    titleEl.textContent = title;
    confirmBtn.textContent = t("confirm");
    cancelBtn.textContent = t("cancel");

    if (isPrompt) {
      bodyEl.innerHTML = `<p style="margin:0 0 10px 0;">${esc(body)}</p><input type="text" id="modalInput" maxlength="${MAX_NAME_LENGTH}" value="${esc(defaultValue)}">`;
    } else {
      bodyEl.innerHTML = `<p style="margin:0;">${esc(body)}</p>`;
    }

    overlay.classList.add("active");
    const inputEl = $("modalInput");
    if (inputEl) { inputEl.focus(); inputEl.select(); }

    const cleanup = () => {
      overlay.classList.remove("active");
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      window.removeEventListener("keydown", onKeyDown);
    };

    const onConfirm = () => {
      cleanup();
      resolve(isPrompt ? (inputEl ? inputEl.value.trim().slice(0, MAX_NAME_LENGTH) : "") : true);
    };

    const onCancel = () => {
      cleanup();
      resolve(isPrompt ? null : false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter") onConfirm();
      if (e.key === "Escape") onCancel();
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    window.addEventListener("keydown", onKeyDown);
  });
}

function applyDesign() {
  document.documentElement.style.setProperty("--card-width", `${$("cardWidth").value}px`);
  document.documentElement.style.setProperty("--child-gap", `${$("spacing").value}px`);
  document.documentElement.style.setProperty("--gen-gap", `${$("generation").value}px`);
  requestAnimationFrame(drawConnections);
}

function updateTransform() {
  $("stage").style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  $("zoomLabel").textContent = `${Math.round(zoom * 100)}%`;
}

function render() {
  $("tree").innerHTML = "";
  if (!people.length) {
    $("tree").innerHTML = `<div class="empty"><h2>${esc(t("emptyTitle"))}</h2><p>${esc(t("emptyText"))}</p></div>`;
    updateSelected(); applyDesign(); drawConnections(); return;
  }
  const wrap = document.createElement("div"); wrap.className = "tree";
  roots().forEach(r => wrap.appendChild(personGroup(r)));
  $("tree").appendChild(wrap);
  updateSelected(); applyDesign();
}

function personGroup(person) {
  const group = document.createElement("div"); group.className = "root-group";
  const card = document.createElement("button");
  card.type = "button";
  const isMatch = searchQuery && person.name.toLowerCase().includes(searchQuery);
  card.className = "card" + (person.id === selectedId ? " selected" : "") + (isMatch ? " highlighted" : "");
  card.dataset.id = person.id;
  card.setAttribute("aria-pressed", person.id === selectedId ? "true" : "false");
  card.setAttribute("aria-label", `${person.name}, ${person.parentId === null ? t("root") : t("member")}`);
  card.innerHTML = `<div class="name">${esc(person.name)}</div><div class="role">${esc(person.parentId === null ? t("root") : t("member"))}</div>`;
  card.addEventListener("click", (e) => { e.stopPropagation(); selectedId = person.id; render(); });
  group.appendChild(card);
  const kids = children(person.id);
  if (kids.length) {
    const c = document.createElement("div"); c.className = "children";
    kids.forEach(k => {
      const child = document.createElement("div"); child.className = "child";
      child.appendChild(personGroup(k)); c.appendChild(child);
    });
    group.appendChild(c);
  }
  return group;
}

// Dynamic SVG Lines
function drawConnections() {
  const svg = $("svgOverlay");
  svg.innerHTML = "";
  if (!people.length) return;

  const stageRect = $("stage").getBoundingClientRect();

  people.forEach(person => {
    const parentCard = document.querySelector(`.card[data-id="${person.id}"]`);
    const kids = children(person.id);
    if (!parentCard || !kids.length) return;

    const pRect = parentCard.getBoundingClientRect();
    const parentX = (pRect.left + pRect.width / 2 - stageRect.left) / zoom;
    const parentY = (pRect.bottom - stageRect.top) / zoom;

    kids.forEach(kid => {
      const childCard = document.querySelector(`.card[data-id="${kid.id}"]`);
      if (!childCard) return;

      const cRect = childCard.getBoundingClientRect();
      const childX = (cRect.left + cRect.width / 2 - stageRect.left) / zoom;
      const childY = (cRect.top - stageRect.top) / zoom;

      const midY = parentY + (childY - parentY) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${parentX} ${parentY} V ${midY} H ${childX} V ${childY}`);
      svg.appendChild(path);
    });
  });
}

function updateSelected() {
  const box = $("selectedBox");
  if (selectedId === null) { box.innerHTML = `<strong>${esc(t("none"))}</strong>${esc(t("clickPerson"))}`; return; }
  const p = get(selectedId);
  if (!p) { selectedId = null; updateSelected(); return; }
  box.innerHTML = `<strong>${esc(p.name)}</strong>${esc(t("children"))}: ${children(p.id).length}`;
}

async function addRoot() {
  const name = await showModal({ title: t("addRoot"), body: t("namePrompt") });
  if (!name) return;
  const p = { id: nextId++, name, parentId: null };
  people.push(p); selectedId = p.id; saveState(); render();
}

async function addChild() {
  if (selectedId === null) { alert(t("selectFirst")); return; }
  const p = get(selectedId); if (!p) return;
  const name = await showModal({ title: t("addChild"), body: t("childPrompt") });
  if (!name) return;
  const c = { id: nextId++, name, parentId: p.id };
  people.push(c); selectedId = c.id; saveState(); render();
}

async function editPerson() {
  if (selectedId === null) { alert(t("selectFirst")); return; }
  const p = get(selectedId); if (!p) return;
  const name = await showModal({ title: t("edit"), body: t("editPrompt"), defaultValue: p.name });
  if (!name) return;
  p.name = name; saveState(); render(); toast(t("saved"));
}

// Cycle guard so a self-referencing or looping parentId (crafted by hand,
// or corrupted in transit) can never make this recurse forever.
function collectDesc(id, set = new Set()) {
  children(id).forEach(c => {
    if (!set.has(c.id)) { set.add(c.id); collectDesc(c.id, set); }
  });
  return set;
}

async function deletePerson() {
  if (selectedId === null) { alert(t("selectFirst")); return; }
  const p = get(selectedId), desc = collectDesc(p.id);
  let msg = `${t("deleteConfirm")} "${p.name}"?`;
  if (desc.size) msg += `\n\n${t("branchWarning")}`;
  const confirmed = await showModal({ title: t("delete"), body: msg, isPrompt: false });
  if (!confirmed) return;
  const doomed = new Set([p.id, ...desc]);
  people = people.filter(x => !doomed.has(x.id));
  selectedId = null; saveState(); render();
}

async function reset() {
  if (!people.length) return;
  const confirmed = await showModal({ title: t("reset"), body: t("resetConfirm"), isPrompt: false });
  if (!confirmed) return;
  people = []; selectedId = null; nextId = 1; saveState(); render();
}

function setZoom(z) {
  zoom = Math.max(.3, Math.min(2.5, z));
  updateTransform();
  requestAnimationFrame(drawConnections);
}

// Mouse Pan Canvas Setup
const canvas = $("canvas");
canvas.addEventListener("mousedown", (e) => {
  if (e.target.closest(".card")) return;
  isDragging = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  panX = e.clientX - startX;
  panY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => { isDragging = false; });

// Touch Drag & Pinch Zoom Support for Mobile
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    if (e.target.closest(".card")) return;
    isDragging = true;
    startX = e.touches[0].clientX - panX;
    startY = e.touches[0].clientY - panY;
  } else if (e.touches.length === 2) {
    isDragging = false;
    initialPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialZoom = zoom;
  }
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (isDragging && e.touches.length === 1) {
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    updateTransform();
  } else if (e.touches.length === 2 && initialPinchDist) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = dist / initialPinchDist;
    setZoom(initialZoom * factor);
  }
}, { passive: true });

canvas.addEventListener("touchend", () => {
  isDragging = false;
  initialPinchDist = null;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  setZoom(zoom + delta);
}, { passive: false });

function exportTree() {
  const data = { version: 2, nextId, people, design: { cardWidth: $("cardWidth").value, spacing: $("spacing").value, generation: $("generation").value } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = "family-tree.json"; a.click(); URL.revokeObjectURL(url); toast(t("exported"));
}

// Validates and coerces a raw `people` array from an import file. Returns
// the normalized array, or null if the data is malformed in any way that
// could otherwise crash rendering (duplicate ids, dangling parent
// references, a person who is their own parent, or a longer cycle of
// parentId references).
function normalizePeople(rawPeople) {
  const normalized = rawPeople.map(p => ({
    id: Number(p.id),
    name: String(p.name || "Unnamed").slice(0, MAX_NAME_LENGTH),
    parentId: (p.parentId === null || p.parentId === undefined) ? null : Number(p.parentId)
  }));

  const ids = new Set();
  for (const p of normalized) {
    if (!Number.isFinite(p.id) || p.id < 1) return null;
    if (ids.has(p.id)) return null; // duplicate id
    ids.add(p.id);
  }
  for (const p of normalized) {
    if (p.parentId !== null && !ids.has(p.parentId)) return null; // dangling reference
    if (p.parentId === p.id) return null; // self-parent
  }

  const byId = new Map(normalized.map(p => [p.id, p]));
  for (const p of normalized) {
    const seen = new Set();
    let cur = p, steps = 0;
    while (cur.parentId !== null) {
      if (seen.has(cur.id)) return null; // cycle
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
      if (!cur) return null;
      if (++steps > normalized.length) return null; // safety valve
    }
  }
  return normalized;
}

function importTree(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.people)) throw new Error("shape");
      const normalized = normalizePeople(d.people);
      if (!normalized) throw new Error("invalid-structure");
      people = normalized; nextId = Math.max(0, ...normalized.map(p => p.id)) + 1; selectedId = null;
      if (d.design) {
        if (d.design.cardWidth) $("cardWidth").value = d.design.cardWidth;
        if (d.design.spacing) $("spacing").value = d.design.spacing;
        if (d.design.generation) $("generation").value = d.design.generation;
      }
      saveState(); render(); toast(t("imported"));
    } catch (e) {
      alert(e && e.message === "invalid-structure" ? t("invalidCycle") : t("invalid"));
    }
  };
  r.readAsText(file);
}

function updateLanguage() {
  const map = {
    appTitle:"appTitle",appSubtitle:"appSubtitle",searchSection:"searchSection",treeSection:"treeSection",addRoot:"addRoot",reset:"reset",
    selectedSection:"selectedSection",addChild:"addChild",edit:"edit",delete:"delete",designSection:"designSection",
    widthLabel:"width",spacingLabel:"spacing",generationLabel:"generation",languageSection:"language",languageLabel:"languageLabel",
    dataSection:"data",export:"export",import:"import",aboutSection:"beta",aboutText:"about"
  };
  Object.entries(map).forEach(([id, key]) => { if ($(id)) $(id).textContent = t(key); });
  $("search").placeholder = t("searchPlaceholder");
  $("language").value = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = ["ar","he","fa","ur"].includes(lang) ? "rtl" : "ltr";
  render();
}

// Drawer Sidebar Setup
const sidebar = $("sidebar");
const sidebarToggle = $("sidebarToggle");
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  requestAnimationFrame(drawConnections);
});
canvas.addEventListener("click", () => sidebar.classList.remove("open"));

$("search").addEventListener("input", (e) => { searchQuery = e.target.value.trim().toLowerCase(); render(); });
$("addRoot").addEventListener("click", addRoot);
$("addChild").addEventListener("click", addChild);
$("edit").addEventListener("click", editPerson);
$("delete").addEventListener("click", deletePerson);
$("reset").addEventListener("click", reset);
$("zoomIn").addEventListener("click", () => setZoom(zoom + .1));
$("zoomOut").addEventListener("click", () => setZoom(zoom - .1));
$("zoomReset").addEventListener("click", () => { panX = 0; panY = 0; setZoom(1); });
["cardWidth", "spacing", "generation"].forEach(id => $(id).addEventListener("input", () => { applyDesign(); saveState(); }));
$("export").addEventListener("click", exportTree);
$("import").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", e => { if (e.target.files[0]) importTree(e.target.files[0]); e.target.value = ""; });
$("language").addEventListener("change", e => { lang = e.target.value; updateLanguage(); });

window.addEventListener("resize", drawConnections);

// Initialization
if (!loadState()) {
  const demoRoot = { id: nextId++, name: "Grandfather", parentId: null }; people.push(demoRoot);
  const father = { id: nextId++, name: "Father", parentId: demoRoot.id }; people.push(father);
  const uncle = { id: nextId++, name: "Uncle", parentId: demoRoot.id }; people.push(uncle);
  people.push({ id: nextId++, name: "You", parentId: father.id }, { id: nextId++, name: "Sibling", parentId: father.id }, { id: nextId++, name: "Cousin", parentId: uncle.id });
  saveState();
}

updateLanguage();
setZoom(1);
})();
