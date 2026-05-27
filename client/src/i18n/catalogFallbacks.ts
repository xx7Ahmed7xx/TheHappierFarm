/** Client fallbacks when API catalog rows lack DisplayNameAr/En (older DB seeds). */
export const CROP_NAMES_AR: Record<number, string> = {
  1: 'شعير مشمس',
  2: 'جزر سريع',
  3: 'قمح ذهبي',
  4: 'طماطم متسلقة',
  5: 'يقطين خريفي',
};

export const ANIMAL_NAMES_AR: Record<number, string> = {
  1: 'بقرة هولشتاين',
  2: 'خروف صوفي',
  3: 'دجاجة بياض',
};

export const FACTORY_NAMES_AR: Record<number, string> = {
  1: 'مكبس الجبن',
  2: 'مخبز القمح',
  3: 'معصرة الزيت',
  4: 'حظيرة التخزين',
};

export const DECORATION_NAMES_AR: Record<number, string> = {
  1: 'شجرة بلوط',
  2: 'بركة صغيرة',
  3: 'سياج خشبي',
};

export const RESOURCE_NAMES_AR: Record<string, string> = {
  barley: 'شعير',
  carrot: 'جزر',
  wheat: 'قمح',
  tomato: 'طماطم',
  pumpkin: 'يقطين',
  milk: 'حليب',
  wool: 'صوف',
  egg: 'بيض',
  cheese: 'جبن',
  bread: 'خبز',
  oil: 'زيت',
};
