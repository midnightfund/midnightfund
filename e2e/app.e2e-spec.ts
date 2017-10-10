import { MidnightfundPage } from './app.po';

describe('midnightfund App', () => {
  let page: MidnightfundPage;

  beforeEach(() => {
    page = new MidnightfundPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('MidnightFund');
  });
});
