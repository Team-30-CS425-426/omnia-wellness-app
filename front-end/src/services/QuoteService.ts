export type Quote = {
    quote: string;
    author: string;
};

const FALLBACK_QUOTES: Quote[] = [
    {
        quote: "Progress is progress, no matter how slow",
        author: "Omnia Team",
    },
    {
        quote: "You showed up today. That matters.",
        author: "Omnia Team",
    },
    {
        quote: "It always seems impossible until it's done",
        author: "Omnia Team",
    },
    {
        quote: "One small postive thought in the morning can change your whole day",
        author: "Omnia Team",
    },
    {
        quote: "Your only limit is your mind",
        author: "Omnia Team",
    },
];
function getFallbackQuote(): Quote{
    const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[index];
}

const Quote_API_URL = 'https://api.realinspire.live/v1/quotes/random';
const DEFAULT_TIME_MS = 5000;

type ApiQuote = {
    content: string;
    author: string;
    authorSlug: string;
    length: number;
};

async function fetchWithTimeout(
    url: string,
    timeoutMs : number
): Promise<Response>{
    return new Promise((resolve,reject) => {
        const timer = setTimeout (() => {
            reject(new Error('Request timed out'));
        }, timeoutMs);
        fetch (url)
            .then ((res) => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

export async function fetchRandomQuote(timeoutMs: number = DEFAULT_TIME_MS): Promise<Quote> {
    try{
        const res = await fetchWithTimeout(Quote_API_URL, timeoutMs);
        if (!res.ok){
            throw new Error('Failed to fetch quote');
        }
        const data: ApiQuote[] = await res.json();
        if (!Array.isArray(data) || data.length === 0){
           throw new Error('Empty quote list from API');
        }
        const first = data[0];
        const quoteText = (first.content || '').trim() || 'No quote available.';
        const authorText = (first.author || '').trim() || 'Unknown';
        return {
            quote: quoteText,
            author: authorText,
        };
    }catch (err){
        console.warn('Quote API failed, using fallback quote:', err);
        return getFallbackQuote();
    }
}