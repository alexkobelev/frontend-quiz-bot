require('dotenv').config();
const {
  Bot,
  Keyboard,
  InlineKeyboard,
  GrammyError,
  HttpError,
} = require('grammy');
const { getRandomQuestion, getCorrectAnswer } = require('./utils.js');

const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('Random')
    .resized();

  await ctx.reply(
    'Привет! Фронтендер? А почему не на фронте?\n\nЛадно, ладно, шучу! 😏\n\nЯ - Frontend Quiz Bot 🤖 моя задача помочь тебе подготовиться к интервью по фронте'
  );

  await ctx.reply('C чего начнем? Выбери тему вопроса в меню 👇', {
    reply_markup: startKeyboard,
  });
});

bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Random'], async (ctx) => {
  const userTopic = ctx.message.text;
  const { question, questionTopic } = getRandomQuestion(userTopic);

  let keyboard;

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        option.text,
        JSON.stringify({
          type: `${questionTopic}-option`,
          isCorrect: option.isCorrect,
          questionId: question.id,
        })
      ),
    ]);
    keyboard = InlineKeyboard.from(buttonRows);
  } else {
    keyboard = new InlineKeyboard().text(
      'Узнать ответ',
      JSON.stringify({
        type: questionTopic,
        questionId: question.id,
      })
    );
  }

  await ctx.reply(question.text, {
    reply_markup: keyboard,
  });
});

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);

    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply('✅');
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0],
    callbackData.questionId
  );
  await ctx.reply(`❌\n${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

bot.start();
