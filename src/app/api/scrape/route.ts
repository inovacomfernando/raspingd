
import {NextResponse} from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {targetUrl, selectors, dataToExtract} = body;

    if (!targetUrl || !selectors) {
      return NextResponse.json({error: 'Target URL and selectors are required.'}, {status: 400});
    }

    const {data: htmlContent} = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(htmlContent);

    const selectorArray = selectors
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s);

    if (selectorArray.length === 0) {
        return NextResponse.json({ error: 'No valid selectors provided.' }, { status: 400 });
    }

    let allScrapedTexts: string[] = [];
    let detailedReportParts: string[] = [];

    selectorArray.forEach((selector: string) => {
      if (selector.startsWith('/') || selector.startsWith('(')) {
        console.warn(`[Scraping API] Attempting to use XPath-like selector: "${selector}". For best results with Cheerio, consider using CSS selectors.`);
      }
      try {
        const elements = $(selector);
        let textsFromThisSelector: string[] = [];
        
        elements.each((_i, element) => {
          const text = $(element).text().trim();
          if (text) {
            textsFromThisSelector.push(text);
          }
        });

        if (textsFromThisSelector.length > 0) {
          detailedReportParts.push(`Selector "${selector}":\n  - Found texts:\n    ${textsFromThisSelector.map(t => `"${t}"`).join('\n    ')}`);
          allScrapedTexts.push(...textsFromThisSelector);
        } else {
          if (elements.length > 0) {
            detailedReportParts.push(`Selector "${selector}": Matched ${elements.length} element(s), but found no text content.`);
          } else {
            detailedReportParts.push(`Selector "${selector}": Did not match any elements.`);
          }
        }
      } catch (e) {
        detailedReportParts.push(`Selector "${selector}": Error during processing - ${(e as Error).message}`);
        console.warn(`[Scraping API] Error processing selector "${selector}": ${(e as Error).message}`);
      }
    });
    
    let resultText = "";
    const reportIntroduction = `Attempted to scrape "${dataToExtract || 'specified data'}" from ${targetUrl}.\nSelectors used: ${selectorArray.join('; ')}\n\n--- Detailed Selector Report ---\n`;
    const reportBody = detailedReportParts.join('\n\n');

    if (allScrapedTexts.length > 0) {
      resultText = `Successfully scraped content for "${dataToExtract || 'specified data'}":\n\n${allScrapedTexts.join('\n---\n')}\n\n${reportIntroduction}${reportBody}`;
    } else {
      resultText = `No text content was extracted.\n${reportIntroduction}${reportBody}`;
    }

    return NextResponse.json({scrapedText: resultText});

  } catch (error: any) {
    console.error('[Scraping API] Error:', error);
    let errorMessage = 'Failed to scrape the website.';
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `Failed to fetch the page. Status: ${error.response.status} - ${error.response.statusText}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({error: errorMessage, scrapedText: `Scraping failed: ${errorMessage}`}, {status: 500});
  }
}
