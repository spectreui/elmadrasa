// mobile/src/hooks/useUniversalLink.ts
import { useCallback } from 'react';
import { generateCurrentPageLink, generateLinkForCurrentRoute } from '../src/utils/linking';

interface UseUniversalLinkOptions {
  baseUrl?: string;
}

export const useUniversalLink = (options: UseUniversalLinkOptions = {}) => {
  const { baseUrl = 'https://elmadrasa.vercel.app' } = options;

  const generateLink = useCallback((
    path: string,
    params: Record<string, string | number | boolean> = {}
  ) => {
    return generateCurrentPageLink(path, params as Record<string, string>);
  }, []);

  const generateRouteLink = useCallback((
    routeName: string,
    params: Record<string, string> = {}
  ) => {
    return generateLinkForCurrentRoute(routeName, params);
  }, []);

  return {
    generateLink,
    generateRouteLink,
    baseUrl
  };
};

// Specific hooks for common use cases
export const useHomeworkLink = () => {
  const { generateLink } = useUniversalLink();
  
  const generateHomeworkLink = useCallback((homeworkId: string, additionalParams: Record<string, string> = {}) => {
    return generateLink(`student/homework/${homeworkId}`, additionalParams);
  }, [generateLink]);
  
  return { generateHomeworkLink };
};

export const useExamLink = () => {
  const { generateLink } = useUniversalLink();
  
  const generateExamLink = useCallback((examId: string, additionalParams: Record<string, string> = {}) => {
    return generateLink(`student/exam/${examId}`, additionalParams);
  }, [generateLink]);
  
  return { generateExamLink };
};
