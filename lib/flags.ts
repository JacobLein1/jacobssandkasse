export const FLAGS: Record<string, string> = {
  // Europa
  Norway: '🇳🇴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Portugal: '🇵🇹',
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Croatia: '🇭🇷',
  Denmark: '🇩🇰',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Austria: '🇦🇹',
  Serbia: '🇷🇸',
  Ukraine: '🇺🇦',
  Hungary: '🇭🇺',
  'Czech Republic': '🇨🇿',
  Romania: '🇷🇴',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Greece: '🇬🇷',
  'Bosnia and Herzegovina': '🇧🇦',
  Slovakia: '🇸🇰',
  Albania: '🇦🇱',
  Turkey: '🇹🇷',

  // Sør-Amerika
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Uruguay: '🇺🇾',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',
  Chile: '🇨🇱',
  Peru: '🇵🇪',
  Paraguay: '🇵🇾',
  Venezuela: '🇻🇪',
  Bolivia: '🇧🇴',

  // Nord- og Mellom-Amerika
  'United States': '🇺🇸',
  Mexico: '🇲🇽',
  Canada: '🇨🇦',
  Panama: '🇵🇦',
  'Costa Rica': '🇨🇷',
  Jamaica: '🇯🇲',
  Haiti: '🇭🇹',
  Honduras: '🇭🇳',
  'Trinidad and Tobago': '🇹🇹',
  Curaçao: '🇨🇼',

  // Asia
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  Australia: '🇦🇺',
  Iran: '🇮🇷',
  'Saudi Arabia': '🇸🇦',
  Iraq: '🇮🇶',
  Jordan: '🇯🇴',
  Uzbekistan: '🇺🇿',
  Qatar: '🇶🇦',

  // Afrika
  Morocco: '🇲🇦',
  Senegal: '🇸🇳',
  Nigeria: '🇳🇬',
  'Ivory Coast': '🇨🇮',
  Egypt: '🇪🇬',
  'South Africa': '🇿🇦',
  Cameroon: '🇨🇲',
  Ghana: '🇬🇭',
  Tunisia: '🇹🇳',
  Algeria: '🇩🇿',
  Mali: '🇲🇱',

  // Oseania
  'New Zealand': '🇳🇿',
}

export function flag(team: string): string {
  return FLAGS[team] ?? '🏳️'
}