const axios = require('axios');
const fs = require('fs');
const AdmZip = require('adm-zip');

const DART_API_KEY = '5c9accf36ccce63a5649ee91522e9c726b4aff01';

async function main() {
    console.log('DART corp_code 목록 다운로드 중...');

    const response = await axios.get(
        'https://opendart.fss.or.kr/api/corpCode.xml',
        {
            params: { crtfc_key: DART_API_KEY },
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }
    );

    console.log(`다운로드 완료 (${response.data.byteLength} bytes), ZIP 파싱 중...`);

    const zip = new AdmZip(Buffer.from(response.data));
    const xml = zip.readAsText('CORPCODE.xml');

    const mapping = {};

    // 실제 XML 구조에 맞게 수정된 파싱
    const listRegex = /<list>([\s\S]*?)<\/list>/g;
    let listMatch;

    while ((listMatch = listRegex.exec(xml)) !== null) {
        const block = listMatch[1];

        const corpCodeMatch = block.match(/<corp_code>(\d+)<\/corp_code>/);
        const corpNameMatch = block.match(/<corp_name>([^<]+)<\/corp_name>/);
        const stockCodeMatch = block.match(/<stock_code>([^<]+)<\/stock_code>/);

        if (!corpCodeMatch || !stockCodeMatch) continue;

        const corp_code = corpCodeMatch[1];
        const corp_name = corpNameMatch ? corpNameMatch[1] : '';
        const stock_code = stockCodeMatch[1].trim();

        // 공백이 아닌 stock_code만 저장 (비상장 제외)
        if (stock_code) {
            mapping[stock_code] = { corp_code, corp_name };
        }
    }

    const count = Object.keys(mapping).length;
    console.log(`총 ${count}개 상장 종목 매핑 완료`);

    fs.writeFileSync('corp_mapping.json', JSON.stringify(mapping, null, 2));
    console.log('corp_mapping.json 저장 완료!');
    console.log('삼성전자 예시:', JSON.stringify(mapping['005930'], null, 2));
}

main().catch(console.error);