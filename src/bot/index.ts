import type { ChatId } from 'node-telegram-bot-api';
import { Env } from '../env';
import { Context as PluginContext, GoogleImageSearch, Plugin, Tenor, Youtube } from './plugins';
import { TelegramApi } from './telegram-api';

type PluginDerived = { new (ctx: PluginContext): Plugin } & typeof Plugin;

const mapping: [RegExp, PluginDerived][] = [
  [/^(?:пик|пикча|img|image|pic|picture) (.+)/i, GoogleImageSearch],
  [/^(?:видео|video|youtube|ютуб) (.+)/i, Youtube],
  [/^(?:gif|гиф|гифка) (.+)/i, Tenor],
  //   [/^(?:тикток|тик-ток|tiktok|tik-tok) (.+)/, Plugin],
];

interface Context {
  env: Env;
  text: string;
  chatId: ChatId;
  replyTo: number;
  caption?: string;
  resultNum: number;
}

export async function parseAndRespond({ text, resultNum, ...ctx }: Context): Promise<void> {
  try {
    for (const [regex, plugin] of mapping) {
      if (regex.test(text)) {
        const [, match] = text.match(regex) ?? [];
        await new plugin({ ...ctx, query: match }).processAndRespond(resultNum);
      }
    }
  } catch (err: any) {
    console.error(err);

    await new TelegramApi(ctx.env.TG_TOKEN).sendMessage({
      chat_id: ctx.chatId,
      text: `\`\`\`${err?.name}: ${err?.message}\`\`\``,
      reply_to_message_id: ctx.replyTo,
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  }
}

export { TelegramApi };
