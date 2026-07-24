/**
 * テンプレート変数を展開するエンジン
 * キャプションと透かしで共通利用する
 */

interface TemplateVars {
  date: string;
  time: string;
  datetime: string;
  loc: string;
  lat: string;
  lng: string;
  app: string;
  account: string;
}

/** 現在の日時からデフォルトのテンプレート変数を生成する */
export function buildDefaultVars(accountName: string): TemplateVars {
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);

  return {
    date,
    time,
    datetime: `${date} ${time}`,
    loc: '',
    lat: '',
    lng: '',
    app: 'Insta-Imme',
    account: accountName,
  };
}

/** テンプレート文字列内の ${変数名} を置換する */
export function expandTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key: string) => {
    if (key in vars) return vars[key as keyof TemplateVars];
    return match;
  });
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}
