import del from 'del';
import path from 'path';

import task from './task';

module.exports = task('clear', async () => {
  const local = path.join(__dirname, '../deploy/local');

  const paths = await del([`${local}/*`]);

  console.log('cleared: ', paths);
});
