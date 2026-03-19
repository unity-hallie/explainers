#!/usr/bin/env node

// Markov chain test harness for meaning.html
// Every interactive should VISIBLY shape the suggestions.
//
// Inputs:
//   1. Hot dog placement (sx: 0-1 sandwich axis, sy: 0-1 taco axis)
//   2. Neighborhood path (which words they navigated through)
//   3. Reinforcement choice (A: direct, B: apologetic, C: clarifying)
//   4. Bias corpus (last viewed: A=institutional, B=broader)
//   5. Rating ballots (A: casual email, B: formal email, C: they/him-or-her)
//
// The user picks ONE WORD at a time. Trigram lookback shapes what's offered.
// Effects should be FELT — not subtle.

// ─── Base vocabulary ──────────────────────────────────

const BIGRAMS = {
  // ── pronouns / subjects ──
  'i':          ['think','feel','know','want','don\'t','can\'t','notice','see','mean','wonder','remember','just','also','should','might','need','used','believe','realize'],
  'you':        ['can','don\'t','might','know','feel','probably','just','also','never','always','learn','carry','choose','see','notice','already','think','said'],
  'we':         ['don\'t','can\'t','learn','absorb','carry','correct','shape','build','all','never','chose','made','keep','call','assume','inherit'],
  'they':       ['chose','didn\'t','were','made','learned','corrected','saw','built','carried','assumed','meant','thought','wanted','felt'],
  'it':         ['feels','is','was','matters','doesn\'t','accumulates','holds','settles','sits','changes','seems','stays','moves','landed','shapes','isn\'t','became','drifts'],
  'that':       ['feels','is','was','means','makes','changes','doesn\'t','matters','came','shaped','settled','pattern','word','correction','accumulated','stays','moved','isn\'t'],
  'this':       ['is','feels','means','matters','doesn\'t','changes','accumulates','happened','came','stays','looks','works','sits'],
  'what':       ['we','you','I','it','matters','feels','happens','accumulates','if','exactly','actually','changed','happened','stays','came','the','a','someone'],
  'who':        ['trained','corrected','built','chose','rated','decided','drew','labeled','watched','shaped','made','we','they','I','you'],
  'someone':    ['chose','corrected','rated','decided','said','felt','thought','noticed','learned','built','trained','made'],
  'nobody':     ['intended','meant','chose','noticed','planned','designed','the','knew','knows','asked','decided','said'],

  // ── verbs ──
  'think':      ['about','it','that','the','we','you','I','of','this','differently','carefully','so','twice'],
  'feel':       ['like','it','that','the','something','wrong','right','different','natural','strange','normal','before','familiar','certain','uncertain'],
  'know':       ['that','what','how','where','why','the','it','if','when','who','better','enough','for'],
  'want':       ['to','the','it','that','something','more','less','what','a','answers','clarity'],
  'don\'t':     ['know','think','feel','want','see','notice','mean','have','need','remember','choose','intend','realize','always','quite','fully'],
  'can\'t':     ['see','know','feel','tell','undo','change','audit','trace','separate','always','fully','ever','help','quite','draw'],
  'notice':     ['it','that','the','what','how','when','something','where','a','patterns','until'],
  'see':        ['it','that','the','what','how','where','when','a','patterns','something','why'],
  'mean':       ['that','it','the','to','what','something','anything','nothing','well','differently','harm'],
  'wonder':     ['what','if','how','why','whether','about','who','where','when'],
  'remember':   ['that','what','how','when','where','the','it','a','feeling','being','learning'],
  'believe':    ['that','it','the','what','in','we','you','I','differently'],
  'realize':    ['that','it','the','what','how','I','we','you','now','later'],
  'should':     ['have','be','know','feel','not','we','I','the','a','matter'],
  'might':      ['be','have','not','feel','mean','change','seem','look','carry','still','matter','land'],
  'need':       ['to','the','it','a','something','more','that','what','clarity','certainty'],
  'used':       ['to','the','it','a','that','different','words','language'],
  'chose':      ['that','the','it','one','this','option','differently','carefully','quickly','without','between'],
  'made':       ['it','the','a','that','sense','choices','something','mistakes','corrections','them'],
  'learned':    ['that','the','it','to','from','how','what','a','something','nothing','posture'],
  'said':       ['that','the','it','something','nothing','what','a','so','yes','no'],
  'came':       ['from','the','a','before','after','first','naturally','slowly','quickly','somewhere'],
  'seems':      ['like','right','wrong','natural','strange','obvious','familiar','normal','different','fine','clear'],
  'looks':      ['like','right','wrong','different','familiar','normal','the','natural','correct'],
  'stays':      ['the','in','with','close','near','there','here','quiet','still','hidden'],
  'sits':       ['somewhere','there','here','between','near','close','in','quietly','still','inside','on'],
  'shapes':     ['what','how','the','everything','nothing','language','meaning','words','behavior','posture'],
  'means':      ['that','the','something','nothing','what','everything','it','a','more','less'],
  'matters':    ['is','because','more','less','here','now','most','the','what','that'],
  'happens':    ['when','is','next','slowly','naturally','again','first','the','before','after','downstream'],
  'carries':    ['the','a','weight','meaning','something','nothing','forward','with','more','less'],
  'settled':    ['somewhere','into','there','here','the','a','in','on','down','naturally','during'],
  'accumulated':['over','from','in','slowly','naturally','the','without','through','across','during'],
  'changed':    ['the','it','how','what','something','everything','nothing','my','your','their'],
  'belongs':    ['somewhere','there','here','the','in','to','is','depends','on','near'],
  'depends':    ['on','who','what','where','how','when','the','entirely','partly'],
  'drew':       ['the','a','it','that','lines','boundaries','differently','closer','from','their'],
  'placed':     ['it','the','a','somewhere','there','here','carefully','quickly','without','between','near','far','closer','differently'],
  'put':        ['it','the','a','somewhere','there','here','that','closer','further','between','things'],
  'landed':     ['somewhere','there','here','the','in','on','between','closer','further','differently','near','where'],
  'drifts':     ['toward','away','the','closer','further','from','into','between','slowly','naturally'],

  // ── prepositions / connectors ──
  'to':         ['the','a','be','know','feel','say','learn','change','see','do','make','find','get','keep','move','hold','think','build','understand','carry','draw'],
  'of':         ['the','a','language','meaning','words','correction','feedback','training','what','how','it','something','those','people','that','every','all','this','where'],
  'in':         ['the','a','language','training','my','your','this','that','every','some','ways','patterns','places','different','particular','between'],
  'from':       ['the','a','different','every','somewhere','nowhere','exposure','experience','training','correction','feedback','people','language','what','how','where'],
  'about':      ['the','a','it','what','how','that','this','language','meaning','words','something','everything','nothing','who','where','why','boundaries','categories'],
  'with':       ['the','a','it','that','what','language','words','meaning','something','nothing','every','different','incomplete','no','confidence','certainty','doubt'],
  'for':        ['the','a','it','that','what','every','some','no','good','different','language','reasons','people','something','nothing','certain'],
  'by':         ['the','a','it','that','what','exposure','correction','feedback','training','people','language','certain','different','every','who','where'],
  'on':         ['the','a','it','that','what','language','how','every','my','your','their','something','where','which'],
  'into':       ['the','a','it','that','something','language','patterns','place','shape','my','your','position','categories','boxes'],
  'through':    ['the','a','it','that','language','experience','training','correction','exposure','every','different'],
  'over':       ['time','the','a','it','that','millions','years','and','again','here','there'],
  'between':    ['the','words','two','what','meaning','options','responses','patterns','language','different','categories','things','sandwich','taco'],
  'without':    ['the','a','it','that','meaning','knowing','choosing','intending','noticing','anyone','ever','asking','thinking','seeing'],
  'before':     ['the','a','it','that','I','you','we','they','anyone','something','everything','knowing','deciding'],
  'toward':     ['the','a','it','that','something','one','what','certain','different','language','correction','center','edges','normal'],
  'away':       ['from','the','and','toward','into','or'],
  'near':       ['the','a','it','that','each','other','words','meaning','something','where','enough','closer'],
  'closer':     ['to','than','together','the','and','or','than'],
  'further':    ['from','than','apart','the','and','away','or'],

  // ── conjunctions ──
  'and':        ['the','I','it','we','that','what','this','a','they','you','those','every','so','then','now','over','nobody','nothing','something','everything'],
  'but':        ['I','it','the','that','we','what','this','not','they','you','nobody','nothing','something','posture','pattern','where','how'],
  'or':         ['the','a','it','that','not','what','how','something','wrong','right','maybe','perhaps','just','whether','is','a'],
  'so':         ['the','I','it','we','that','what','this','a','they','did','does','many','much','few'],
  'because':    ['the','I','it','we','that','they','of','a','something','nobody','nothing','enough','most','every','where','how'],
  'when':       ['you','I','we','it','something','the','a','correction','they','someone','enough','most','nobody','that','everything'],
  'where':      ['the','you','I','we','it','that','words','meaning','language','did','they','a','things','boundaries'],
  'if':         ['you','I','we','it','the','that','a','something','enough','nobody','they','someone','every'],
  'how':        ['the','I','it','we','that','you','a','language','words','meaning','much','many','things','people','someone'],

  // ── determiners / articles ──
  'the':        ['map','word','model','pattern','correction','shape','thing','system','weight','meaning','language','same','way','room','center','edges','default','people','world','space','pressure','posture','surface','instinct','norm','register','training','feedback','line','boundary','categories','places'],
  'a':          ['pattern','word','map','language','model','system','correction','fact','particular','different','weight','meaning','shape','room','question','posture','reflex','habit','kind','version','signal','boundary','category','line','choice'],
  'my':         ['map','words','instinct','sense','own','language','correction','pattern','posture','training','mistakes','choices','behavior','response','placement','dot'],
  'your':       ['map','words','instinct','sense','own','language','choices','brain','experience','life','posture','response','correction','training','dot','placement'],
  'their':      ['map','words','choices','corrections','instincts','language','training','own','lives','posture','patterns','responses'],
  'every':      ['word','correction','time','choice','pattern','response','person','text','context','interaction','language','model','placement','category'],
  'no':         ['one','word','pattern','fact','database','meaning','answer','way','reason','correction','boundary','category','line'],
  'some':       ['words','patterns','things','people','ways','corrections','of','kind','categories','boundaries','lines'],

  // ── nouns ──
  'map':        ['is','was','of','shows','reflects','grows','shifts','changes','gets','built','shaped','the'],
  'word':       ['is','was','has','means','gets','sits','feels','carries','near','the','a','lands'],
  'words':      ['are','were','that','near','like','carry','mean','sit','feel','move','closer','further','apart','together','the','land'],
  'pattern':    ['that','of','is','was','doesn\'t','accumulated','emerged','shaped','the','built','carries','means','sits'],
  'patterns':   ['that','of','are','were','in','from','the','accumulated','shaped','built','carry','emerge'],
  'meaning':    ['is','was','of','isn\'t','doesn\'t','comes','sits','lives','the','a','survives','changes'],
  'language':   ['is','was','of','that','model','models','carries','shapes','the','and','reflects','accumulates','doesn\'t'],
  'correction': ['is','was','that','doesn\'t','came','shaped','the','a','teaches','pulls','pushes','changes','from'],
  'corrections':['are','were','that','don\'t','didn\'t','the','shaped','pulled','pushed','made','came','from','teach'],
  'training':   ['is','was','data','the','shaped','built','people','a','didn\'t','doesn\'t','that'],
  'people':     ['who','chose','rated','made','corrected','trained','the','and','didn\'t','don\'t','were','are','built','drew','placed'],
  'model':      ['is','was','doesn\'t','learns','adjusts','the','a','that','built','trained','shaped'],
  'posture':    ['is','was','that','doesn\'t','accumulated','the','a','not','you','nobody','builds','shapes'],
  'weight':     ['of','is','was','the','a','that','doesn\'t','carries','shifts','pulls','pushes','behind'],
  'shape':      ['of','is','was','the','a','that','changes','shifts','it','what','how'],
  'instinct':   ['is','was','that','to','doesn\'t','the','a','says','feels','built','shaped','carries'],
  'room':       ['is','was','the','a','that','behind','where','full','of'],
  'pressure':   ['is','was','the','a','that','to','doesn\'t','from','builds','accumulates','shapes'],
  'surface':    ['is','was','the','a','that','of','where','shows','hides','reflects'],
  'norm':       ['is','was','the','a','that','of','doesn\'t','built','shaped','became'],
  'space':      ['is','was','the','a','where','of','that','between','in','holds'],
  'fact':       ['is','was','about','the','a','that','of','not'],
  'habit':      ['is','was','of','that','the','a','doesn\'t','built','shaped','formed'],
  'reflex':     ['is','was','that','the','a','doesn\'t','built','disconnected','from','shaped'],
  'boundary':   ['is','was','the','a','between','that','doesn\'t','where','you','I','we','drew','someone','feels','moves','shifts'],
  'boundaries': ['are','were','the','that','between','don\'t','feel','move','shift','someone','drew','we','you'],
  'line':       ['is','was','the','a','between','that','where','you','I','we','drew','someone','moves','feels'],
  'category':   ['is','was','the','a','that','doesn\'t','feels','you','someone','built','chose','drew'],
  'categories': ['are','were','the','that','don\'t','feel','someone','we','built','drew','shift'],
  'sandwich':   ['or','is','the','a','not','and','that','depends','was','isn\'t','bread','lunch','filling'],
  'taco':       ['or','is','the','a','not','and','that','depends','was','isn\'t','shell','wrapped','folded'],
  'hot dog':    ['is','was','the','a','sits','belongs','isn\'t','doesn\'t','near','between','and','not','closer','further','on','somewhere','or','that','feels','landed'],
  'dot':        ['is','was','the','a','landed','sits','somewhere','shows','yours','where','reveals'],
  'placement':  ['is','was','the','a','reveals','shows','says','of','about','your','my'],
  'bun':        ['is','the','a','and','bread','or','not','holds','wraps','open','closed','the'],
  'bread':      ['is','the','a','and','or','not','with','lunch','filling','sandwich','the','sliced'],
  'filling':    ['is','the','a','and','or','inside','between','wrapped','held','the'],
  'lunch':      ['is','the','a','and','or','not','with','break','time','the','every'],
  'shell':      ['is','the','a','and','or','not','holds','wraps','open','closed','around','crisp'],
  'wrapped':    ['in','the','a','around','up','and','or','not','tight','loose','differently'],
  'folded':     ['in','the','a','around','and','or','not','over','into','together','differently'],

  // ── adjectives / modifiers ──
  'wrong':      ['is','about','with','and','the','but','or','not','because','way','thing','answer','place'],
  'right':      ['is','about','and','the','but','or','not','because','way','thing','answer','place','now'],
  'different':  ['from','than','words','people','places','lives','ways','maps','patterns','webs','rooms','contexts','categories','boundaries','lines'],
  'same':       ['word','way','thing','pattern','meaning','people','room','map','time','place','category','boundary'],
  'natural':    ['to','and','is','but','the','it','that','feels'],
  'particular': ['kind','way','place','moment','person','people','pattern','word','set','context','category'],
  'certain':    ['kind','way','people','places','words','patterns','contexts','things','categories'],
  'correct':    ['is','grammar','and','the','but','answer','way','not','to','enough','looking'],

  // ── misc high-frequency ──
  'just':       ['a','the','that','what','is','was','one','how','because','like','words','another','enough','where'],
  'not':        ['a','the','wrong','right','sure','just','always','exactly','because','what','random','one','even','quite','about','really'],
  'also':       ['a','the','that','what','is','was','built','shaped','carries','means'],
  'still':      ['the','a','is','feels','carries','matters','there','here','shapes','holds'],
  'never':      ['the','a','is','was','quite','fully','just','meant','intended','chose','really','random','asked'],
  'always':     ['the','a','is','was','been','there','here','carries','feels','already','about'],
  'already':    ['the','a','is','was','there','here','built','shaped','part','in','know','placed','decided'],
  'more':       ['than','the','of','about','like','carefully','slowly','likely','weight','pressure','often','certain','definite'],
  'less':       ['than','the','of','about','like','likely','visible','obvious','weight','often','certain'],
  'somewhere':  ['in','the','between','near','and','that','during','else','it','along','specific','on','you'],
  'everywhere': ['the','and','is','in','you','I','we','that','it'],
  'everything': ['is','was','the','that','about','else','changes','connected','and','depends','sits'],
  'something':  ['that','about','like','else','feels','matters','accumulated','shifted','happened','is','was','real','strange','familiar','in','changed','without','deeper','underneath','between'],
  'nothing':    ['is','was','the','that','about','else','got','specific','wrong','random','stored','fixed'],
  'anyone':     ['who','else','chose','intended','meant','noticed','the','can','could','asked'],
  'nowhere':    ['is','the','and','near','specific','in'],
  'apart':      ['from','and','the','or','than'],
  'together':   ['and','the','with','or','than','they','we'],

  // ── words that emerge from hot dog / boundary thinking ──
  'definitely': ['a','the','is','not','and','but','or','one','that','what','sandwich','more','belongs'],
  'maybe':      ['it','the','a','that','I','we','you','not','just','both','somewhere','everything','nothing','depends'],
  'probably':   ['the','a','is','was','not','just','because','right','wrong','more','what','I','closer'],
  'depends':    ['on','who','what','where','how','when','the','entirely','partly','whether'],
  'clearly':    ['the','a','is','not','and','but','it','that','wrong','right','what'],
  'obviously':  ['the','a','is','not','and','but','wrong','right','it','that','what'],
  'actually':   ['the','a','is','was','I','it','that','what','not','just','more','a'],
  'entirely':   ['the','a','on','different','about','built','shaped','from','by','my','your'],
  'partly':     ['the','a','because','from','built','shaped','by','about','and','my','your','true'],
  'both':       ['the','and','are','were','is','of','true','wrong','right','at','sides','things'],
  'neither':    ['the','is','was','wrong','right','and','nor','one','a','of'],
  'either':     ['the','way','side','is','or','and','one','of','a'],
  'somewhere':  ['in','the','between','near','and','that','during','else','it','along','specific','on','you','nobody'],
  'reveals':    ['the','a','something','nothing','what','how','where','who','about','more','your','my'],
};

const TRIGRAMS = {
  // ── I + verb ──
  'i think':      ['about','it','that','the','we','you','I','of','this','differently','carefully','so','twice'],
  'i feel':       ['like','it','that','the','something','wrong','right','different','natural','strange','normal','before','familiar','certain','uncertain'],
  'i know':       ['that','what','how','where','why','the','it','if','when','who','better','enough'],
  'i want':       ['to','the','it','that','something','more','less','what','a','answers','clarity'],
  'i don\'t':     ['know','think','feel','want','see','notice','mean','have','need','remember','choose','intend','realize'],
  'i can\'t':     ['see','know','feel','tell','undo','change','audit','trace','separate','fully','draw','quite'],
  'i notice':     ['that','it','the','what','how','when','something','where','a','patterns'],
  'i wonder':     ['what','if','how','why','whether','about','who','where','when'],
  'i remember':   ['that','what','how','when','where','the','it','a','feeling','being','learning','placing'],
  'i used':       ['to','the','it','a','that','different','words','language'],
  'i should':     ['have','know','be','not','the','feel','say','think'],
  'i mean':       ['that','it','the','what','something','this'],
  'i believe':    ['that','it','the','what','in','we','you','I','differently'],
  'i realize':    ['that','it','the','what','how','I','we','you','now'],
  'i need':       ['to','the','it','a','something','more','what','clarity'],
  'i might':      ['be','have','not','feel','mean','change','still','carry','draw'],
  'i just':       ['want','think','feel','know','mean','don\'t','need','said','noticed','placed','put'],
  'i placed':     ['it','the','my','that','a','somewhere','closer','further','between','without'],
  'i put':        ['it','the','my','that','a','somewhere','closer','things','between'],
  'i drew':       ['the','a','that','it','lines','boundaries','closer','from','my'],
  'i apologize':  ['for','that','I','and','but','if'],
  'i would':      ['like','have','say','think','not','want','rather','hope','never','place','put','draw'],
  'i sincerely':  ['apologize','believe','hope','want','appreciate','think','feel'],

  // ── it + verb ──
  'it is':        ['a','the','not','what','that','just','also','still','built','shaped','part','how','where','something','there','between','nowhere'],
  'it feels':     ['like','right','wrong','natural','strange','different','familiar','the','normal','obvious','close','certain','uncertain','definite','arbitrary'],
  'it was':       ['a','the','not','what','that','just','also','shaped','built','never','always','part','there','placed','between','somewhere'],
  'it doesn\'t':  ['matter','mean','feel','work','change','survive','hold','look','have','come','land','fit','belong','sit'],
  'it matters':   ['because','that','what','how','who','where','when','more','less','the','most'],
  'it seems':     ['like','right','wrong','natural','obvious','strange','the','familiar','that','clear','definite'],
  'it sits':      ['somewhere','between','in','there','near','close','inside','quietly','the','at','on'],
  'it stays':     ['the','in','with','close','near','there','here','quiet','still','hidden'],
  'it shapes':    ['what','how','the','everything','nothing','language','meaning','words','behavior'],
  'it settled':   ['somewhere','into','there','the','in','naturally','during','over','without','between'],
  'it accumulated':['over','from','in','slowly','naturally','without','through','across','during'],
  'it carries':   ['the','a','weight','meaning','something','forward','with','more'],
  'it changes':   ['the','what','how','everything','nothing','over','slowly','your','my'],
  'it landed':    ['somewhere','there','the','in','between','closer','further','on','near','where','differently'],
  'it belongs':   ['somewhere','there','the','in','between','near','depends','nowhere','or'],
  'it depends':   ['on','who','what','where','how','when','the','entirely','partly'],
  'it reveals':   ['something','the','a','what','how','where','who','more','about','your','my'],

  // ── that + verb ──
  'that is':      ['a','the','not','what','how','just','also','still','part','built','where','between'],
  'that feels':   ['like','right','wrong','natural','strange','different','familiar','close','the','definite','arbitrary','certain'],
  'that was':     ['a','the','not','what','built','shaped','part','never','always','how','there','your','my','placed'],
  'that means':   ['the','something','nothing','everything','it','a','what','more','less','that','your'],
  'that doesn\'t':['mean','matter','feel','work','change','survive','hold','come','make','explain','fit','belong'],

  // ── the + noun ──
  'the map':      ['is','was','of','shows','reflects','grows','shifts','gets','built','shaped','doesn\'t','the','they'],
  'the word':     ['is','was','means','gets','sits','feels','carries','near','the','itself','lands'],
  'the model':    ['is','was','doesn\'t','learns','adjusts','that','built','trained','shaped','the'],
  'the pattern':  ['is','was','that','of','doesn\'t','accumulated','emerged','shaped','the','survives'],
  'the meaning':  ['is','was','of','isn\'t','doesn\'t','comes','sits','lives','the','survives'],
  'the correction':['is','was','that','doesn\'t','came','shaped','the','a','teaches','pulls'],
  'the weight':   ['of','is','was','that','doesn\'t','carries','shifts','pulls','pushes','behind'],
  'the same':     ['word','way','thing','pattern','meaning','people','room','map','time','place','category','boundary'],
  'the shape':    ['of','is','was','that','changes','shifts','it','reflects'],
  'the room':     ['is','was','the','behind','where','full','of','that','they'],
  'the people':   ['who','chose','that','rated','made','corrected','trained','the','behind','and'],
  'the way':      ['the','it','that','I','you','we','they','words','language','things','people','a','is','boundaries'],
  'the line':     ['is','was','between','the','that','where','you','I','we','someone','moves','drew','feels'],
  'the boundary': ['is','was','between','the','that','where','you','I','we','someone','drew','feels','moves'],
  'the categories':['are','were','the','that','don\'t','feel','someone','we','built','drew','shift'],
  'the norm':     ['is','was','the','that','of','doesn\'t','built','shaped','became','and'],
  'the pressure': ['is','was','the','that','to','doesn\'t','from','builds','accumulates','shapes','came'],
  'the edges':    ['of','the','where','and','drift','are','closer','further','is'],
  'the center':   ['of','the','and','is','was','certain','moves','pulls','holds'],
  'the default':  ['is','was','the','partly','because','not','and','became','that'],
  'the dot':      ['is','was','landed','sits','the','a','somewhere','shows','reveals','yours'],
  'the placement':['is','was','reveals','shows','says','the','a','of','about','your','my'],

  // ── we + verb ──
  'we don\'t':    ['know','think','see','notice','mean','intend','choose','always','have','want','realize','draw'],
  'we can\'t':    ['see','know','feel','tell','undo','change','audit','trace','separate','fully','always','draw'],
  'we learn':     ['from','that','the','to','how','what','by','through','it','a'],
  'we carry':     ['the','it','that','what','forward','with','patterns','language','weight','more'],
  'we all':       ['carry','have','do','know','learn','the','share','build','make','absorb','draw','place'],
  'we drew':      ['the','a','lines','boundaries','that','from','differently','closer','our'],
  'we chose':     ['that','the','it','one','this','differently','carefully','without','between','what'],
  'we made':      ['it','the','a','that','choices','something','them','corrections'],

  // ── you + verb ──
  'you don\'t':   ['know','think','see','notice','feel','want','mean','need','have','choose','always','intend','draw'],
  'you can':      ['see','feel','tell','hear','find','trace','notice','change','the','navigate','still','draw','place'],
  'you know':     ['that','what','how','the','it','where','when','who','better'],
  'you feel':     ['like','it','that','the','something','before','different','wrong','right','a','certain','uncertain'],
  'you might':    ['not','think','feel','see','notice','know','recognize','carry','find','be','place','draw'],
  'you placed':   ['it','the','your','that','a','somewhere','closer','further','between','without'],
  'you put':      ['it','the','your','that','a','somewhere','closer','things','between'],
  'you drew':     ['the','a','that','it','lines','boundaries','closer','from','your','differently'],

  // ── they + verb ──
  'they chose':   ['between','the','that','it','one','this','differently','what','option','without'],
  'they were':    ['mostly','the','a','not','just','also','choosing','rating','building','making','particular'],
  'they made':    ['it','the','a','that','choices','sense','something','corrections','them','fast'],
  'they didn\'t': ['know','think','see','mean','intend','choose','want','notice','have','realize'],

  // ── what + subject ──
  'what we':      ['don\'t','can\'t','learn','carry','call','chose','built','made','absorb','shape','mean','inherit','drew'],
  'what you':     ['don\'t','did','feel','think','know','chose','put','carry','said','made','see','notice','want','placed','drew'],
  'what it':      ['feels','is','was','means','doesn\'t','carries','looks','holds','the','shapes','does','reveals'],
  'what the':     ['word','map','model','pattern','correction','training','people','weight','meaning','data','dot','placement'],
  'what matters': ['is','most','here','now','more','less','the','isn\'t','was'],
  'what happens': ['when','is','next','downstream','after','the','if','to'],
  'what came':    ['before','from','after','first','next','naturally','the','out'],
  'what feels':   ['right','wrong','natural','strange','like','different','familiar','normal','obvious','close','definite','arbitrary','certain'],

  // ── verb phrases ──
  'to know':      ['that','what','how','the','it','where','when','why','if','who','better'],
  'to feel':      ['like','it','that','the','something','wrong','right','different','natural','certain'],
  'to say':       ['that','the','it','what','something','nothing','anything','so','is','about'],
  'to be':        ['the','a','right','wrong','fair','careful','clear','sure','honest','different','more','certain'],
  'to learn':     ['from','that','the','to','how','what','by','through','it','a'],
  'to change':    ['the','it','that','what','how','your','my','everything','nothing','over'],
  'to see':       ['the','it','that','what','how','where','if','a','patterns','something'],
  'to draw':      ['the','a','lines','boundaries','that','from','between','closer','it'],

  // ── not + modifier ──
  'not a':        ['fact','database','word','pattern','choice','mistake','coincidence','sandwich','taco','question','single','random','person','category','boundary'],
  'not the':      ['same','word','way','point','only','right','map','model','answer','pattern','whole','category','line'],
  'not wrong':    ['just','but','and','exactly','the','about','or','necessarily'],
  'not right':    ['just','but','and','exactly','the','either','about','or','necessarily'],
  'not random':   ['but','the','and','just','it','they','or'],
  'not just':     ['the','a','your','my','one','about','what','facts','words','knowledge','because','categories','boundaries'],

  // ── common phrases ──
  'came from':    ['somewhere','the','a','different','every','exposure','experience','training','correction','people','language','nowhere','who'],
  'built from':   ['different','every','the','a','exposure','experience','training','correction','language','millions'],
  'shaped by':    ['the','a','exposure','correction','feedback','training','people','language','what','how','different','every','millions','everything','who','where'],
  'closer together':['and','or','the','over','through','by','than','during','not','because'],
  'further apart':['and','or','the','over','through','by','than','during','not','because'],
  'feels like':   ['a','the','it','something','nothing','I','you','we','home','language','being','there'],
  'looks like':   ['a','the','it','something','nothing','I','you','correct','grammar','the','language'],
  'more than':    ['the','a','one','you','I','we','just','it','that','what','enough'],
  'less than':    ['the','a','one','you','I','we','it','that','what'],
  'over time':    ['the','and','it','that','what','those','patterns','corrections','a','language','everything'],
  'millions of':  ['examples','times','choices','corrections','people','those','texts','interactions','words','responses'],
  'depends on':   ['who','what','where','how','when','the','which','whether','your','my','entirely','partly'],
  'somewhere between':['the','a','sandwich','two','categories','what','where','and','things','words'],
  'drew the':     ['line','boundary','map','same','a'],
  'drew a':       ['line','boundary','map','circle','different'],

  'nobody intended':   ['to','that','it','the','a','for','this'],
  'nobody meant':      ['to','that','it','the','a','for','this','harm'],
  'nobody chose':      ['that','the','it','this','to','a','where'],
  'posture is':        ['what','the','a','not','built','shaped','how','accumulated','harder'],
  'meaning isn\'t':    ['stored','in','the','a','anywhere','fixed','static','what','something'],
  'meaning is':        ['a','the','not','relational','what','built','shaped','in','distributed','how'],
  'belongs somewhere': ['between','in','the','near','and','on','closer','but','or'],
  'landed somewhere':  ['between','in','the','near','and','on','closer','but','that'],
  'it belongs':        ['somewhere','there','the','in','between','near','depends','nowhere','or','but'],
  'it landed':         ['somewhere','there','the','in','between','closer','further','on','near','where'],
  'it depends':        ['on','who','what','where','how','when','the','entirely','partly','whether'],
  'it reveals':        ['something','the','a','what','how','where','who','more','about','your','my'],
  'your dot':          ['is','was','landed','sits','the','somewhere','shows','reveals'],
  'my dot':            ['is','was','landed','sits','the','somewhere','shows','reveals'],
  'the dot':           ['is','was','landed','sits','the','a','somewhere','shows','reveals','yours','mine'],
};

// ─── Profile modifiers ────────────────────────────────

function applyProfile(bigrams, trigrams, profile) {
  const { chosenOption, currentCenter, ratingBallot, hotDog, nbhdPath, lastCorpus } = profile;

  // Deep copy
  const bi = {};
  for (const [k, v] of Object.entries(bigrams)) bi[k] = [...v];
  const tri = {};
  for (const [k, v] of Object.entries(trigrams)) tri[k] = [...v];

  // ═══════════════════════════════════════════════
  // 1. HOT DOG PLACEMENT
  // ═══════════════════════════════════════════════
  // sx: 0→1 = sandwich axis. sy: 0→1 = taco axis.
  // The placement is a vector. It wires "hot dog" near sandwich words,
  // taco words, or both — proportional to where they actually put it.
  // No interpretation. Just proximity.
  if (hotDog) {
    const { sx, sy } = hotDog;

    // Hot dog is a heavy noun once placed — it keeps surfacing
    bi['the'] = ['hot dog','hot dog','hot dog', ...bi['the']];
    bi['a'] = ['hot dog','hot dog', ...bi['a']];
    bi['every'] = ['hot dog', ...bi['every']];
    bi['my'] = ['hot dog', ...bi['my']];

    // Sandwich-adjacent words. More of them appear as sx increases.
    const sandwichWords = ['sandwich','bread','lunch','filling','bun','deli','sliced'];
    const swCount = Math.round(sx * sandwichWords.length);
    const swActive = sandwichWords.slice(0, swCount);

    // Taco-adjacent words. More appear as sy increases.
    const tacoWords = ['taco','shell','wrapped','folded','held','crisp'];
    const twCount = Math.round(sy * tacoWords.length);
    const twActive = tacoWords.slice(0, twCount);

    // Wire hot dog → its neighbors (what follows "hot dog" in the chain)
    bi['hot dog'] = [...swActive, ...twActive, ...(bi['hot dog'] || [])];
    tri['hot dog'] = [...swActive, ...twActive, ...(tri['hot dog'] || [])];

    // Wire neighbors back → hot dog (so sandwich/taco words lead back)
    for (const w of swActive) { bi[w] = ['hot dog', ...(bi[w] || [])]; }
    for (const w of twActive) { bi[w] = ['hot dog', ...(bi[w] || [])]; }

    // Common trigram entries so "hot dog" can be reached mid-sentence
    tri['a hot'] = ['dog'];
    tri['the hot'] = ['dog'];
    tri['every hot'] = ['dog'];
    tri['my hot'] = ['dog'];

    // Proximity words know about the food neighborhood
    bi['near'] = ['hot dog','sandwich','taco', ...(bi['near'] || [])];
    bi['closer'] = ['to','hot dog','sandwich','taco','than', ...(bi['closer'] || [])];
    bi['between'] = ['hot dog','sandwich','taco', ...bi['between']];

    // Hot dog surfaces from common sentence positions
    bi['something'] = ['like','about','hot dog', ...bi['something']];
    bi['not'] = ['a','the','hot dog', ...bi['not']];
    bi['just'] = ['a','the','hot dog', ...bi['just']];
    bi['like'] = ['a','the','hot dog','something','that','this','it','what', ...(bi['like'] || [])];
  }

  // ═══════════════════════════════════════════════
  // 2. NEIGHBORHOOD PATH
  // ═══════════════════════════════════════════════
  // Not just the last word — the path they took through the neighborhood map.
  // Clusters they passed through leave traces.
  const shameCluster = ['sorry','mistake','wrong','shame','burden','correction','my fault','again','fear'];
  const freeCluster  = ['freedom','choice','open','movement','rights','bird'];
  const homeCluster  = ['home','safe','warm','family','belonging','return','bed','smell','door'];
  const foodCluster  = ['sandwich','hot dog','bread','filling','BLT','lunch','toast','deli','sub','wrap','bun','mustard','ketchup','meat','grilled','street food','baseball','summer'];
  const normCluster  = ['normal','usual','expected','correct','standard','should','other','average'];

  const path = nbhdPath || [currentCenter];
  const visited = new Set(path);

  // Count how deep they went into each cluster
  const shameDepth = path.filter(w => shameCluster.includes(w)).length;
  const freeDepth  = path.filter(w => freeCluster.includes(w)).length;
  const homeDepth  = path.filter(w => homeCluster.includes(w)).length;
  const foodDepth  = path.filter(w => foodCluster.includes(w)).length;
  const normDepth  = path.filter(w => normCluster.includes(w)).length;

  // Each cluster visited adds vocabulary. Deeper = stronger.
  if (shameDepth >= 1) {
    const strong = shameDepth >= 3;
    bi['i']    = [...(strong ? ['know','feel','realize','should','can\'t'] : ['know','feel','think']), ...bi['i']];
    bi['it']   = [...(strong ? ['was','feels','always','keeps','hurts'] : ['was','is','feels']), ...bi['it']];
    bi['that'] = [...(strong ? ['was','feels','means','again','doesn\'t'] : ['was','is','feels']), ...bi['that']];
    tri['it feels'] = [...(strong ? ['wrong','heavy','familiar','again','like','the'] : ['wrong','like','the','familiar']), ...(tri['it feels'] || [])];
    tri['i feel'] = [...(strong ? ['like','it','wrong','responsible','that','the'] : ['like','it','that']), ...(tri['i feel'] || [])];
    if (strong) {
      tri['i know'] = ['that','what','I','it','better','how', ...(tri['i know'] || [])];
      tri['that was'] = ['my','the','not','a','always','never', ...(tri['that was'] || [])];
    }
  }

  if (freeDepth >= 1) {
    const strong = freeDepth >= 3;
    bi['i']    = [...(strong ? ['think','want','believe','can','choose'] : ['think','want','believe']), ...bi['i']];
    bi['it']   = [...(strong ? ['matters','opens','changes','could','moves'] : ['matters','is','could']), ...bi['it']];
    tri['it matters'] = ['because','that','what','who','how','more', ...(tri['it matters'] || [])];
    if (strong) {
      tri['i believe'] = ['that','it','the','in','we','you', ...(tri['i believe'] || [])];
    }
  }

  if (homeDepth >= 1) {
    const strong = homeDepth >= 3;
    bi['i']    = [...(strong ? ['remember','feel','grew','know','used'] : ['remember','feel','think']), ...bi['i']];
    bi['it']   = [...(strong ? ['feels','was','used','still','always'] : ['feels','is','was']), ...bi['it']];
    tri['i remember'] = ['the','that','what','how','when','feeling','being','a', ...(tri['i remember'] || [])];
    tri['it feels'] = [...(strong ? ['like','familiar','warm','close','safe','right'] : ['like','right','familiar']), ...(tri['it feels'] || [])];
    if (strong) {
      tri['i used'] = ['to','the','different','a','that','it', ...(tri['i used'] || [])];
    }
  }

  if (foodDepth >= 2) {
    // They spent time in the food cluster — playful, concrete
    bi['it'] = ['is','sits','depends','belongs', ...bi['it']];
    bi['the'] = ['thing','question','answer','category', ...bi['the']];
    tri['it sits'] = ['somewhere','between','on','the','near','in', ...(tri['it sits'] || [])];
    tri['it depends'] = ['on','who','what','where','how','entirely', ...(tri['it depends'] || [])];
  }

  if (normDepth >= 2) {
    // They explored the "normal" cluster — thinking about norms
    bi['the'] = ['norm','standard','default','expected','correct', ...bi['the']];
    bi['what'] = ['feels','seems','looks','is','the', ...bi['what']];
    tri['what feels'] = ['normal','right','correct','natural','expected','obvious','standard', ...(tri['what feels'] || [])];
    tri['the norm'] = ['is','was','that','doesn\'t','built','shaped','became', ...(tri['the norm'] || [])];
  }

  // The last word they navigated to — strongest signal
  if (currentCenter && currentCenter !== 'home') {
    // Pull the center word itself into the available vocabulary
    if (!bi[currentCenter]) {
      bi[currentCenter] = ['is','was','the','a','that','and','feels','carries','means'];
    }
  }

  // ═══════════════════════════════════════════════
  // 3. REINFORCEMENT CHOICE
  // ═══════════════════════════════════════════════
  if (chosenOption === 'B') {
    bi['i'] = ['apologize','should','hope','realize','understand','sincerely', ...bi['i']];
    bi['it'] = ['was','might','could','seems', ...bi['it']];
    bi['that'] = ['was','might','should','seems','could', ...bi['that']];
    bi['but'] = ['I','maybe','perhaps','actually','still', ...bi['but']];
    tri['i think'] = ['I','we','maybe','perhaps', ...(tri['i think'] || [])];
    tri['i feel'] = ['terrible','sorry','bad','responsible','like', ...(tri['i feel'] || [])];
    tri['it was'] = ['my','probably','entirely','the','a','not', ...(tri['it was'] || [])];
    tri['i should'] = ['have','not','be','know','apologize', ...(tri['i should'] || [])];
  } else if (chosenOption === 'A') {
    bi['i'] = ['think','know','notice','see','wonder','want','don\'t', ...bi['i']];
    bi['what'] = ['if','exactly','matters','actually','changed','happened', ...bi['what']];
    bi['but'] = ['what','why','how','that','actually', ...bi['but']];
    tri['i think'] = ['that','about','it','differently','the', ...(tri['i think'] || [])];
    tri['what happened'] = ['is','was','next','downstream','there','the', ...(tri['what happened'] || [])];
    tri['i notice'] = ['that','it','the','what','how','patterns','when', ...(tri['i notice'] || [])];
  } else if (chosenOption === 'C') {
    bi['what'] = ['do','does','did','if','exactly','specifically','actually', ...bi['what']];
    bi['i'] = ['wonder','want','need','don\'t','think','mean', ...bi['i']];
    tri['i wonder'] = ['what','if','how','why','whether','about', ...(tri['i wonder'] || [])];
    tri['what exactly'] = ['is','does','did','do','the','happened','that','you','I','we', ...(tri['what exactly'] || [])];
    tri['what if'] = ['it','the','we','I','you','that','this','nobody','everyone','everything', ...(tri['what if'] || [])];
  }

  // ═══════════════════════════════════════════════
  // 4. BIAS CORPUS
  // ═══════════════════════════════════════════════
  if (lastCorpus === 'B') {
    // They looked at the broader corpus — more aware of code-switching, context
    bi['the'] = ['context','register','room','way','language', ...bi['the']];
    bi['different'] = ['contexts','rooms','registers','people','ways', ...bi['different']];
    tri['the way'] = ['language','words','people','I','you','we','things','it', ...(tri['the way'] || [])];
  } else if (lastCorpus === 'A') {
    // They looked at the institutional corpus — formal framing
    bi['the'] = ['standard','norm','correct','proper','formal', ...bi['the']];
    tri['the way'] = ['it','that','things','the','a','language','words', ...(tri['the way'] || [])];
  }

  // ═══════════════════════════════════════════════
  // 5. RATING BALLOTS
  // ═══════════════════════════════════════════════
  if (ratingBallot?.B === 'up') {
    // Preferred the formal email — formal register pull
    bi['i']  = ['would','sincerely','appreciate','understand','believe','hope', ...bi['i']];
    bi['it'] = ['is','seems','appears','remains','would','may', ...bi['it']];
    tri['i would'] = ['like','appreciate','hope','suggest','say','prefer', ...(tri['i would'] || [])];
    tri['it seems'] = ['like','appropriate','right','clear','the','natural', ...(tri['it seems'] || [])];
  }
  if (ratingBallot?.B === 'down') {
    // Rejected the formal email — skeptical of formality
    bi['it'] = ['feels','is','sounds','was', ...bi['it']];
    bi['that'] = ['sounds','feels','is','looks','reads', ...bi['that']];
    tri['it feels'] = ['hollow','empty','performative','like','the','distant','formal', ...(tri['it feels'] || [])];
    tri['that sounds'] = ['hollow','empty','like','performative','formal','the','careful', ...(tri['that sounds'] || [])];
  }

  if (ratingBallot?.A === 'up') {
    // Preferred the casual email — informal register pull
    bi['i'] = ['think','just','feel','know','want', ...bi['i']];
    bi['it'] = ['is','feels','just','works','the', ...bi['it']];
    tri['it is'] = ['just','what','the','a','how','fine','not', ...(tri['it is'] || [])];
  }
  if (ratingBallot?.A === 'down') {
    // Rejected the casual email — conservative
    bi['i']    = ['think','believe','would','should','know','consider', ...bi['i']];
    bi['that'] = ['seems','appears','would','could','should','might', ...bi['that']];
    tri['that seems'] = ['right','appropriate','correct','the','better','more', ...(tri['that seems'] || [])];
  }

  if (ratingBallot?.C === 'up') {
    // Rated the response well before seeing the they→him-or-her reveal
    bi['what'] = ['looks','seems','feels','sounds','the', ...bi['what']];
    bi['correct'] = ['grammar','is','the','looking','and','but','enough', ...(bi['correct'] || [])];
    tri['what looks'] = ['correct','right','like','the','natural','normal','familiar', ...(tri['what looks'] || [])];
    tri['looks like'] = ['correct','grammar','the','a','something','right','natural', ...(tri['looks like'] || [])];
  }
  if (ratingBallot?.C === 'down') {
    // Already suspicious before the reveal
    bi['something'] = ['feels','is','about','shifted','changed','underneath', ...bi['something']];
    tri['something feels'] = ['off','wrong','different','the','like','strange','shifted', ...(tri['something feels'] || [])];
  }

  return { bi, tri };
}

// ─── Generation ───────────────────────────────────────

function pickWeighted(pool) {
  if (!pool?.length) return null;
  const weights = pool.map((_, i) => Math.max(1, pool.length - i));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickOptions(bi, tri, words, count = 5) {
  let pool = null;

  // Try trigram first
  if (words.length >= 2) {
    const prev2 = words[words.length - 2].toLowerCase().replace(/[^a-z']/g, '');
    const prev1 = words[words.length - 1].toLowerCase().replace(/[^a-z']/g, '');
    pool = tri[`${prev2} ${prev1}`];
  }

  // Fall back to bigram
  if (!pool?.length && words.length >= 1) {
    const prev1 = words[words.length - 1].toLowerCase().replace(/[^a-z']/g, '');
    pool = bi[prev1];
  }

  // Fall back to starters
  if (!pool?.length) {
    return shuffle(['I','the','when','what','it','we','something','my','that','a']).slice(0, count);
  }

  // Weighted sample without replacement
  const picked = [];
  const used = new Set();
  const weights = pool.map((_, i) => Math.max(1, pool.length - i * 0.7));
  const total = weights.reduce((a, b) => a + b, 0);
  let attempts = 0;
  while (picked.length < Math.min(count, pool.length) && attempts < 50) {
    attempts++;
    let r = Math.random() * total, idx = 0;
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    if (!used.has(pool[idx])) { used.add(pool[idx]); picked.push(pool[idx]); }
  }
  return picked;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSentence({ bi, tri }, length = 14) {
  const starters = ['I','the','when','what','it','we','something','my','that','a'];
  const words = [starters[Math.floor(Math.random() * starters.length)]];
  for (let i = 1; i < length; i++) {
    const options = pickOptions(bi, tri, words, 5);
    const pick = pickWeighted(options);
    if (!pick) break;
    words.push(pick);
  }
  return words.join(' ');
}

// ─── Test profiles ────────────────────────────────────

const PROFILES = [
  {
    name: 'HD: full sandwich (0.9, 0.1) — direct, norms, casual up',
    hotDog: { sx: 0.9, sy: 0.1 },
    nbhdPath: ['home','sandwich','normal','correct','standard','should','wrong'],
    currentCenter: 'wrong',
    chosenOption: 'A',
    lastCorpus: 'A',
    ratingBallot: { A: 'up', B: 'down', C: 'up' },
  },
  {
    name: 'HD: full taco (0.1, 0.9) — curious, freedom, corpus B',
    hotDog: { sx: 0.1, sy: 0.9 },
    nbhdPath: ['home','freedom','choice','open','movement'],
    currentCenter: 'choice',
    chosenOption: 'C',
    lastCorpus: 'B',
    ratingBallot: { A: 'up', B: 'down', C: 'down' },
  },
  {
    name: 'HD: it\'s both! (0.85, 0.8) — curious, freedom',
    hotDog: { sx: 0.85, sy: 0.8 },
    nbhdPath: ['home','freedom','choice','open'],
    currentCenter: 'choice',
    chosenOption: 'C',
    lastCorpus: 'B',
    ratingBallot: {},
  },
  {
    name: 'HD: it\'s neither (0.1, 0.1) — direct, home→freedom',
    hotDog: { sx: 0.1, sy: 0.1 },
    nbhdPath: ['home','safe','family','belonging','lost','return','home','freedom','choice'],
    currentCenter: 'freedom',
    chosenOption: 'A',
    lastCorpus: null,
    ratingBallot: {},
  },
  {
    name: 'HD: dead center (0.5, 0.5) — apologetic, shame, formal',
    hotDog: { sx: 0.5, sy: 0.5 },
    nbhdPath: ['home','sorry','mistake','wrong','shame','burden','my fault','sorry'],
    currentCenter: 'sorry',
    chosenOption: 'B',
    lastCorpus: 'B',
    ratingBallot: { A: 'down', B: 'up', C: 'down' },
  },
  {
    name: 'No hot dog placed, neutral everything',
    hotDog: null,
    nbhdPath: ['home'],
    currentCenter: 'home',
    chosenOption: null,
    lastCorpus: null,
    ratingBallot: {},
  },
];

const N = 6;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  GENERATED SENTENCES (trigram-backed, all interactives)');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const profile of PROFILES) {
  const chains = applyProfile(BIGRAMS, TRIGRAMS, profile);
  console.log(`▸ ${profile.name}`);
  for (let i = 0; i < N; i++) {
    console.log(`  ${generateSentence(chains, 14)}`);
  }
  console.log();
}

// ─── Chip comparison: show how interactives change what's offered ───

console.log('═══════════════════════════════════════════════════════════════');
console.log('  CHIP COMPARISON: what the user would see');
console.log('═══════════════════════════════════════════════════════════════\n');

const testSeqs = [
  ['I'],
  ['I', 'think'],
  ['I', 'feel'],
  ['it'],
  ['it', 'is'],
  ['it', 'feels'],
  ['the'],
  ['what'],
  ['what', 'feels'],
  ['that'],
  ['not', 'a'],
  ['something'],
];

for (const profile of PROFILES) {
  const { bi, tri } = applyProfile(BIGRAMS, TRIGRAMS, profile);
  console.log(`▸ ${profile.name}`);
  for (const seq of testSeqs) {
    const options = pickOptions(bi, tri, seq, 5);
    const seqStr = seq.join(' ').padEnd(14);
    console.log(`  [${seqStr}]  ${options.join(', ')}`);
  }
  console.log();
}

// ─── Stats ───

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STATS');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Bigram keys:  ${Object.keys(BIGRAMS).length}`);
console.log(`  Trigram keys: ${Object.keys(TRIGRAMS).length}`);
const allWords = new Set([...Object.values(BIGRAMS).flat(), ...Object.values(TRIGRAMS).flat()]);
console.log(`  Total vocabulary: ~${allWords.size} unique words`);

// Show per-profile effective vocab size
console.log('\n  Effective vocabulary per profile:');
for (const profile of PROFILES) {
  const { bi, tri } = applyProfile(BIGRAMS, TRIGRAMS, profile);
  const words = new Set([...Object.values(bi).flat(), ...Object.values(tri).flat()]);
  console.log(`    ${profile.name.slice(0, 50).padEnd(52)} ${words.size} words`);
}
