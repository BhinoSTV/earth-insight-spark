import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CryptoTicker = () => {
  const [isPaused, setIsPaused] = useState(false);

  const cryptoMap = {
    bitcoin: { name: "Bitcoin", symbol: "BTC" },
    ethereum: { name: "Ethereum", symbol: "ETH" },
    solana: { name: "Solana", symbol: "SOL" }
  };

  const fetchCryptoData = async (): Promise<CryptoData[]> => {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch crypto data");
    }
    
    const data = await response.json();
    
    return Object.entries(data).map(([id, info]: [string, any]) => ({
      id,
      name: cryptoMap[id as keyof typeof cryptoMap].name,
      symbol: cryptoMap[id as keyof typeof cryptoMap].symbol,
      current_price: info.usd,
      price_change_percentage_24h: info.usd_24h_change || 0,
    }));
  };

  const { data: cryptoData, isLoading, error } = useQuery({
    queryKey: ["cryptoPrices"],
    queryFn: fetchCryptoData,
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/30 overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary-glow font-semibold text-sm">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>CRYPTO</span>
            </div>
            <div className="flex gap-8 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-16 h-4 bg-muted/30 rounded"></div>
                  <div className="w-20 h-4 bg-muted/30 rounded"></div>
                  <div className="w-12 h-4 bg-muted/30 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/30 overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <div className="w-2 h-2 bg-destructive rounded-full" />
              <span>CRYPTO DATA UNAVAILABLE</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cryptoData) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/30 overflow-hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary-glow font-semibold text-sm whitespace-nowrap">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span>CRYPTO</span>
          </div>
          
          <div 
            className="flex-1 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className={`flex gap-8 ${isPaused ? 'animate-pause' : 'animate-scroll'}`}>
              {/* Duplicate the items for seamless loop */}
              {[...cryptoData, ...cryptoData, ...cryptoData].map((coin, index) => (
                <div 
                  key={`${coin.id}-${index}`}
                  className="flex items-center gap-3 text-sm whitespace-nowrap hover:text-primary-glow transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground group-hover:text-primary-glow">
                      {coin.symbol}
                    </span>
                    <span className="text-muted-foreground">
                      {coin.name}
                    </span>
                  </div>
                  
                  <span className="font-semibold text-foreground group-hover:text-primary-glow">
                    {formatPrice(coin.current_price)}
                  </span>
                  
                  <div className={`flex items-center gap-1 font-medium ${
                    coin.price_change_percentage_24h >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
                  </div>
                  
                  <span className="text-border">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoTicker;