<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Support\Collection;

class EmployeeSearchService
{
    // Levenshtein distance threshold for fuzzy matching
    const FUZZY_THRESHOLD = 3;

    // Minimum search term length for fuzzy matching
    const MIN_FUZZY_LENGTH = 3;

    // Score weights for ranking
    const WEIGHT_EXACT_MATCH = 100;
    const WEIGHT_STARTS_WITH = 80;
    const WEIGHT_CONTAINS = 60;
    const WEIGHT_FUZZY = 40;

    /**
     * Search employees with fuzzy matching and relevance scoring
     *
     * @param string $query
     * @param int $limit Default 3 (top matches only)
     * @return Collection
     */
    public function search(string $query, int $limit = 3): Collection
    {
        if (empty(trim($query))) {
            return collect([]);
        }

        // Sanitize and extract search terms
        $searchTerms = $this->extractSearchTerms($query);

        if (empty($searchTerms)) {
            return collect([]);
        }

        // Get active employees
        $employees = Employee::where('is_active', true)->get();

        // Score each employee based on relevance
        $scoredEmployees = $employees->map(function ($employee) use ($searchTerms) {
            $score = $this->calculateRelevanceScore($employee, $searchTerms);

            return [
                'employee' => $employee,
                'score' => $score,
            ];
        });

        // Filter out employees with zero score and sort by score
        return $scoredEmployees
            ->filter(fn($item) => $item['score'] > 0)
            ->sortByDesc('score')
            ->take($limit)
            ->map(fn($item) => $item['employee'])
            ->values();
    }

    /**
     * Extract and sanitize search terms from query
     *
     * @param string $query
     * @return array
     */
    protected function extractSearchTerms(string $query): array
    {
        // Normalize whitespace
        $normalized = preg_replace('/\s+/', ' ', trim($query));

        // Split into words and filter short words
        $words = array_filter(
            explode(' ', $normalized),
            fn($word) => mb_strlen($word) >= 2
        );

        // Convert to lowercase for case-insensitive matching
        return array_map('mb_strtolower', $words);
    }

    /**
     * Calculate relevance score for an employee
     *
     * @param Employee $employee
     * @param array $searchTerms
     * @return int
     */
    protected function calculateRelevanceScore(Employee $employee, array $searchTerms): int
    {
        $totalScore = 0;
        $fullName = mb_strtolower($employee->full_name);
        $email = mb_strtolower($employee->email ?? '');
        $nameWords = explode(' ', $fullName);

        foreach ($searchTerms as $term) {
            $termLength = mb_strlen($term);
            $termScore = 0;

            // 1. Check full name exact match
            if ($fullName === $term) {
                $termScore = self::WEIGHT_EXACT_MATCH;
            }
            // 2. Check individual name words exact match
            elseif (in_array($term, $nameWords)) {
                $termScore = self::WEIGHT_EXACT_MATCH;
            }
            // 3. Check starts with (high relevance)
            elseif (str_starts_with($fullName, $term)) {
                $termScore = self::WEIGHT_STARTS_WITH;
            }
            // 4. Check if any name word starts with term
            elseif ($this->anyWordStartsWith($nameWords, $term)) {
                $termScore = self::WEIGHT_STARTS_WITH;
            }
            // 5. Check contains (medium relevance)
            elseif (str_contains($fullName, $term)) {
                $termScore = self::WEIGHT_CONTAINS;
            }
            // 6. Check email match
            elseif (!empty($email) && str_contains($email, $term)) {
                $termScore = self::WEIGHT_CONTAINS;
            }
            // 7. Fuzzy match on individual words (low relevance)
            elseif ($termLength >= self::MIN_FUZZY_LENGTH) {
                $fuzzyScore = $this->calculateFuzzyScore($term, $nameWords);
                if ($fuzzyScore > 0) {
                    $termScore = $fuzzyScore;
                }
            }

            $totalScore += $termScore;
        }

        // Bonus: If multiple terms matched, increase score
        $matchedTerms = $this->countMatchedTerms($employee, $searchTerms);
        if ($matchedTerms > 1) {
            $totalScore += ($matchedTerms - 1) * 20; // Bonus for multi-word match
        }

        return $totalScore;
    }

    /**
     * Check if any word in array starts with the search term
     *
     * @param array $words
     * @param string $term
     * @return bool
     */
    protected function anyWordStartsWith(array $words, string $term): bool
    {
        foreach ($words as $word) {
            if (str_starts_with($word, $term)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate fuzzy matching score using Levenshtein distance
     *
     * @param string $term
     * @param array $nameWords
     * @return int
     */
    protected function calculateFuzzyScore(string $term, array $nameWords): int
    {
        $bestScore = 0;

        foreach ($nameWords as $word) {
            // Skip if word length difference is too large
            $lengthDiff = abs(mb_strlen($term) - mb_strlen($word));
            if ($lengthDiff > self::FUZZY_THRESHOLD) {
                continue;
            }

            $distance = levenshtein($term, $word);

            // Only consider close matches (within threshold)
            if ($distance <= self::FUZZY_THRESHOLD && $distance > 0) {
                // Score inversely proportional to distance
                $score = self::WEIGHT_FUZZY - ($distance * 10);
                $bestScore = max($bestScore, $score);
            }
        }

        return $bestScore;
    }

    /**
     * Count how many search terms found matches in employee data
     *
     * @param Employee $employee
     * @param array $searchTerms
     * @return int
     */
    protected function countMatchedTerms(Employee $employee, array $searchTerms): int
    {
        $fullName = mb_strtolower($employee->full_name);
        $email = mb_strtolower($employee->email ?? '');
        $matchCount = 0;

        foreach ($searchTerms as $term) {
            if (str_contains($fullName, $term) || str_contains($email, $term)) {
                $matchCount++;
            }
        }

        return $matchCount;
    }
}
