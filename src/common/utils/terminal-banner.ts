import * as chalk from 'chalk';
import * as figlet from 'figlet';

type BannerOptions = {
  appUrl: string;
  docsUrl: string;
  nodeEnv: string;
};

const line = chalk.gray('='.repeat(72));
const divider = chalk.gray('-'.repeat(72));

const row = (label: string, value: string): string => {
  return `${chalk.gray('|')} ${chalk.bold(label.padEnd(13))} ${chalk.gray('|')} ${value}`;
};

export const printStartupBanner = ({
  appUrl,
  docsUrl,
  nodeEnv,
}: BannerOptions): void => {
  const title = figlet.textSync('Social API', {
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log('\n' + line);
  console.log(chalk.cyanBright(title));
  console.log(line);
  console.log(
    `${chalk.greenBright('READY')} ${chalk.whiteBright('Social Network API is running')}`,
  );
  console.log(divider);
  console.log(row('Environment', chalk.yellowBright(nodeEnv)));
  console.log(row('API', chalk.blueBright.underline(appUrl)));
  console.log(row('Swagger', chalk.magentaBright.underline(docsUrl)));
  console.log(row('Shutdown', chalk.gray('Press Ctrl+C for graceful shutdown')));
  console.log(line + '\n');
};
