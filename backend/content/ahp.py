"""Adaptive AHP computation utilities.

These helpers power the dashboard's AHP calculator by sampling random
pairwise comparison matrices within the provided bounds and returning
results that meet Saaty's consistency ratio threshold.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np
from scipy.linalg import eig  # type: ignore[import]


@dataclass
class AHPBounds:
    """Container for min/max bounds between two criteria."""

    left_index: int
    right_index: int
    min_value: float
    max_value: float


@dataclass
class AHPResult:
    matrix: np.ndarray
    consistency_ratio: float
    weights: np.ndarray


def calculate_consistency_ratio(matrix: np.ndarray) -> tuple[float, np.ndarray]:
    """Compute the consistency ratio and eigenvector weights for a matrix."""

    n = matrix.shape[0]
    eigenvalues, eigenvectors = eig(matrix)
    real_eigenvalues = np.real(eigenvalues)
    max_eigenvalue = float(np.max(real_eigenvalues))
    max_eigenvalue = max(max_eigenvalue, float(n))
    principal_index = int(np.argmax(real_eigenvalues))
    max_eigenvector = np.real(eigenvectors[:, principal_index])

    weight_sum = np.sum(max_eigenvector)
    if weight_sum == 0:
        weights = np.ones(n) / n
    else:
        weights = max_eigenvector / weight_sum

    consistency_index = max((max_eigenvalue - n) / (n - 1), 0)
    ri_lookup = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
    random_index = ri_lookup.get(n, 1.49)
    if random_index == 0:
        consistency_ratio = 0.0
    else:
        consistency_ratio = float(consistency_index / random_index)

    return round(consistency_ratio, 4), np.round(weights, 4)


def generate_random_matrix(min_values: Sequence[Sequence[float]], max_values: Sequence[Sequence[float]]) -> np.ndarray:
    """Generate a reciprocal matrix within the provided bounds."""

    n = len(min_values)
    matrix = np.ones((n, n), dtype=float)

    for i in range(n):
        for j in range(i + 1, n):
            min_val = float(min_values[i][j])
            max_val = float(max_values[i][j])

            if min_val > max_val:
                min_val, max_val = max_val, min_val

            if min_val == max_val:
                value = min_val
            else:
                value = random.uniform(min_val, max_val)

            if value <= 0:
                value = 1

            matrix[i][j] = value
            matrix[j][i] = 1 / value if value != 0 else 0

    return matrix


def adaptive_ahp_computation(
    min_values: Sequence[Sequence[float]],
    max_values: Sequence[Sequence[float]],
    *,
    target_valid: int = 100,
    max_samples: int = 3000,
    batch_size: int = 100,
) -> tuple[list[AHPResult], list[AHPResult]]:
    """Sample random matrices until the target number of valid ones is found."""

    valid_results: list[AHPResult] = []
    all_results: list[AHPResult] = []
    samples_done = 0

    while samples_done < max_samples and len(valid_results) < target_valid:
        for _ in range(batch_size):
            matrix = generate_random_matrix(min_values, max_values)
            cr, weights = calculate_consistency_ratio(matrix)
            result = AHPResult(matrix=matrix, consistency_ratio=cr, weights=weights)
            all_results.append(result)
            if cr <= 0.1:
                valid_results.append(result)
        samples_done += batch_size

    return valid_results, all_results


def run_adaptive_ahp(
    bounds: Iterable[AHPBounds],
    criteria_count: int,
    *,
    target_valid: int = 100,
    max_samples: int = 3000,
    batch_size: int = 100,
) -> tuple[list[AHPResult], list[AHPResult], float]:
    """Execute the adaptive sampling routine and return timing information."""

    min_matrix = [[1.0 for _ in range(criteria_count)] for _ in range(criteria_count)]
    max_matrix = [[1.0 for _ in range(criteria_count)] for _ in range(criteria_count)]

    for bound in bounds:
        min_matrix[bound.left_index][bound.right_index] = bound.min_value
        max_matrix[bound.left_index][bound.right_index] = bound.max_value

    start = time.perf_counter()
    valid_results, all_results = adaptive_ahp_computation(
        min_matrix,
        max_matrix,
        target_valid=target_valid,
        max_samples=max_samples,
        batch_size=batch_size,
    )
    duration = time.perf_counter() - start
    return valid_results, all_results, duration
