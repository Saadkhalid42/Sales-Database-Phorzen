export const AREA_CODE_TIMEZONES: Record<string, string> = {
  // EST
  '201': 'EST', '202': 'EST', '203': 'EST', '207': 'EST', '212': 'EST', '215': 'EST', '216': 'EST', '223': 'EST', '224': 'EST', '226': 'EST', '231': 'EST', '234': 'EST', '239': 'EST', '240': 'EST', '248': 'EST', '252': 'EST', '267': 'EST', '269': 'EST', '276': 'EST', '283': 'EST', '301': 'EST', '302': 'EST', '304': 'EST', '305': 'EST', '313': 'EST', '315': 'EST', '321': 'EST', '330': 'EST', '334': 'EST', '339': 'EST', '347': 'EST', '351': 'EST', '386': 'EST', '401': 'EST', '404': 'EST', '407': 'EST', '410': 'EST', '412': 'EST', '413': 'EST', '419': 'EST', '423': 'EST', '434': 'EST', '440': 'EST', '443': 'EST', '470': 'EST', '475': 'EST', '478': 'EST', '484': 'EST', '508': 'EST', '513': 'EST', '516': 'EST', '517': 'EST', '518': 'EST', '540': 'EST', '551': 'EST', '561': 'EST', '570': 'EST', '571': 'EST', '585': 'EST', '586': 'EST', '603': 'EST', '607': 'EST', '609': 'EST', '610': 'EST', '614': 'EST', '615': 'EST', '616': 'EST', '617': 'EST', '631': 'EST', '646': 'EST', '678': 'EST', '681': 'EST', '703': 'EST', '704': 'EST', '716': 'EST', '717': 'EST', '718': 'EST', '724': 'EST', '727': 'EST', '732': 'EST', '740': 'EST', '757': 'EST', '770': 'EST', '774': 'EST', '781': 'EST', '786': 'EST', '804': 'EST', '814': 'EST', '828': 'EST', '843': 'EST', '845': 'EST', '856': 'EST', '860': 'EST', '864': 'EST', '904': 'EST', '908': 'EST', '910': 'EST', '914': 'EST', '917': 'EST', '919': 'EST', '929': 'EST', '937': 'EST', '954': 'EST', '973': 'EST', '978': 'EST', '980': 'EST', '989': 'EST',
  
  // CST
  '205': 'CST', '210': 'CST', '214': 'CST', '217': 'CST', '218': 'CST', '219': 'CST', '225': 'CST', '228': 'CST', '251': 'CST', '254': 'CST', '256': 'CST', '262': 'CST', '270': 'CST', '281': 'CST', '308': 'CST', '309': 'CST', '312': 'CST', '314': 'CST', '316': 'CST', '318': 'CST', '319': 'CST', '325': 'CST', '337': 'CST', '361': 'CST', '402': 'CST', '405': 'CST', '409': 'CST', '414': 'CST', '417': 'CST', '430': 'CST', '469': 'CST', '479': 'CST', '501': 'CST', '504': 'CST', '507': 'CST', '512': 'CST', '515': 'CST', '534': 'CST', '539': 'CST', '573': 'CST', '580': 'CST', '601': 'CST', '605': 'CST', '608': 'CST', '612': 'CST', '618': 'CST', '620': 'CST', '630': 'CST', '636': 'CST', '641': 'CST', '660': 'CST', '662': 'CST', '682': 'CST', '701': 'CST', '708': 'CST', '712': 'CST', '713': 'CST', '715': 'CST', '731': 'CST', '763': 'CST', '769': 'CST', '773': 'CST', '785': 'CST', '806': 'CST', '815': 'CST', '816': 'CST', '817': 'CST', '830': 'CST', '832': 'CST', '847': 'CST', '870': 'CST', '901': 'CST', '903': 'CST', '913': 'CST', '915': 'CST', '918': 'CST', '920': 'CST', '931': 'CST', '936': 'CST', '940': 'CST', '952': 'CST', '956': 'CST', '972': 'CST', '979': 'CST',

  // MST
  '208': 'MST', '303': 'MST', '307': 'MST', '385': 'MST', '406': 'MST', '435': 'MST', '480': 'MST', '505': 'MST', '520': 'MST', '575': 'MST', '602': 'MST', '623': 'MST', '719': 'MST', '720': 'MST', '801': 'MST', '928': 'MST', '970': 'MST',

  // PST
  '206': 'PST', '209': 'PST', '213': 'PST', '253': 'PST', '310': 'PST', '323': 'PST', '360': 'PST', '408': 'PST', '415': 'PST', '424': 'PST', '425': 'PST', '442': 'PST', '509': 'PST', '510': 'PST', '530': 'PST', '559': 'PST', '562': 'PST', '619': 'PST', '626': 'PST', '650': 'PST', '661': 'PST', '702': 'PST', '714': 'PST', '747': 'PST', '760': 'PST', '775': 'PST', '805': 'PST', '818': 'PST', '831': 'PST', '858': 'PST', '909': 'PST', '916': 'PST', '925': 'PST', '949': 'PST', '951': 'PST',
  
  // AST (Alaska)
  '907': 'AST',
  
  // HST (Hawaii)
  '808': 'HST'
};

export function getTimezoneFromPhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Strip all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  let areaCode = null;

  // e.g. 2125551234
  if (digits.length === 10) {
    areaCode = digits.substring(0, 3);
  } 
  // e.g. 12125551234
  else if (digits.length === 11 && digits.startsWith('1')) {
    areaCode = digits.substring(1, 4);
  }

  if (areaCode && AREA_CODE_TIMEZONES[areaCode]) {
    return AREA_CODE_TIMEZONES[areaCode];
  }

  return null;
}
