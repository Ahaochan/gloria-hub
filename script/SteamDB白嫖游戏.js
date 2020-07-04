;(async () => {
    const {cheerio} = await importScripts('gloria-utils');

    const free1 = ($ => $('#live-promotions').next('table').find('tbody tr')
        .filter((i, ele) => $(ele).find('td.price-discount').text().includes('Keep'))
        .map((i, ele) => ({
            'title': $(ele).find('td a b').text(),
            'message': $(ele).find('td a b').text(),
            'url': $(ele).find('td.applogo a').attr('href'),
            'iconUrl': $(ele).find('td.applogo a img').attr('src')
        })).get())(cheerio.load(await fetch('https://steamdb.info/upcoming/free/').then(resp => resp.text())));
    return [].concat(free1);
})().then(commit);