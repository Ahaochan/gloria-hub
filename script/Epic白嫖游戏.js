;(async () => {
    const domain = 'https://www.epicgames.com';
    const {cheerio} = await importScripts('gloria-utils');

    // 1. 静态页面的免费游戏获取
    const free1 = ($ => $('div[class^="CardGrid-card_"], div[class^="BrowseGrid-card_"]').map((i, ele) => ({
        'title': $(ele).find('span[data-testid="offer-title-info-title"]').text(),
        'message': $(ele).find('span[data-testid="offer-title-info-subtitle"]').text(),
        'url': domain + $(ele).find('a').attr('href'),
        'iconUrl': $(ele).find('img').attr('data-image')
    })).get())(cheerio.load(await fetch(domain + '/store/zh-CN/free-games')
        .then(resp => resp.text())));

    // 2. 动态请求的免费游戏获取
    const free2 = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN,US')
        .then(res => res.json())
        .then(json => json.data.Catalog.searchStore.elements)
        .then(elements => elements
            .filter(ele => new Date(ele.effectiveDate) <= new Date()) // 过滤不可领取的游戏
            .map(ele => ({
                'title': ele.title,
                'message': ele.description,
                'url': domain + '/store/product/' + ele.productSlug,
                'iconUrl': ele.keyImages.filter(ele => ele.type === 'Thumbnail').map(ele => ele.url)[0]
            })));

    return [].concat(free1, free2);
})().then(commit);