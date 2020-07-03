;(async () => {
    const domain = 'http://tieba.baidu.com';
    const {cheerio} = await importScripts('gloria-utils');

    // 1. 拉取关注贴吧列表
    let urlArray = [];
    for (let index = 0, hasMore = true; hasMore; index++) {
        const html = await fetch(domain + '/f/like/mylike?pn=' + index)
            .then(res => res.arrayBuffer())
            .then(buf => new TextDecoder('gbk').decode(buf));
        const $ = cheerio.load(html);

        urlArray = $('tr').map((i, ele) => domain + '/f?kw=' + $(ele).find('td').first().find('a').attr('title'))
            .filter(url => !!url)
            .toArray()
            .concat(urlArray);
        hasMore = $('div.pagination').find('a').filter((i, ele) => $(ele).text() === '尾页').length > 0;
    }

    let commitArray = [];
    // urlArray = [].concat(urlArray[0]);
    // urlArray = [].concat('http://tieba.baidu.com/f?kw=哔卡哔卡');
    // console.log(urlArray);

    // 2. 拉取贴吧置顶帖
    await Promise.all(urlArray.map(async url => {
        const title = new URL(url).searchParams.get('kw') + '吧';
        const encodedHtml = await fetch(url).then(resp => resp.text());
        const isBan = (($) => $('#forum_not_exist').length > 0)(cheerio.load(encodedHtml));
        if (isBan) {
            console.log('贴吧已被封禁:' + url);
            return [];
        }

        console.log('加载:' + url);
        const iconUrl = encodedHtml.match(/<img class="card_head_img".*src="(\w.+)".*\/>/)
            .filter(s => s.startsWith('https://gss3.bdstatic.com'))
            .map(s => s.replace(/&amp;/g, '&'))
            .map(s => new URL(s).searchParams.get('src'))
            .map(s => decodeURIComponent(s))[0];
        const decodedHtml = (($) => $('.pagelet_html')
            .filter((i, ele) => $(ele).attr('id') === 'pagelet_html_frs-list\/pagelet\/thread_list')
            .map((i, ele) => $(ele).html())
            .map((i, html) => html.replace('<!--', ''))
            .map((i, html) => html.replace('-->', ''))
            .map((i, html) => html.replace("''>", "'>"))
            .get()[0])(cheerio.load(encodedHtml));

        return (($ => $('ul.thread_top_list div.threadlist_title a').map((_i, ele) => {
            return {
                'title': title,
                'message': $(ele).text(),
                'url': domain + $(ele).attr('href'),
                'iconUrl': iconUrl
            }
        }).get()))(cheerio.load(decodedHtml));
    })).then(commits => commitArray = commitArray.concat(commits));
    // console.log(commitArray.flat());
    return commitArray.flat();
})().then(commit);