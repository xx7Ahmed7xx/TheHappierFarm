export type Locale = 'en' | 'ar';

export type MessageTree = {
  [key: string]: string | MessageTree;
};
