import api from "./axios";

export interface MarketTicker {
  symbol: string;
  price: string;
  change: string;
  color: string;
}

export interface MarketInsight {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: string;
}

export interface MarketHomeResponse {
  market: {
    status: string;
    isOpen: boolean;
    lastUpdated: string;
  };
  ticker: MarketTicker[];
  insights: MarketInsight[];
}

export const getMarketHome = async (): Promise<MarketHomeResponse> => {
  const response = await api.get("/market/home");
  return response.data.data;
};