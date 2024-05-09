import pandas as pd
import numpy as np
import math

from generate import FRAME_RATE


def nonnull(func):
    return lambda x: func(x) if pd.notna(x) else None


def none(x):
    return x if pd.notna(x) else None


# Requires: min != max, val in interval [min, max]
def min_max_normalize(val, min_val, max_val):
    return (val - min_val) / (max_val - min_val)


# Requires: x interval [0,1], coeff interval (-1, 1)
def circular_function(x, coeff):
    # Crazy complicated circular like interpolation function
    a = math.sqrt(1-coeff) * math.sqrt(1+coeff)
    b = 1/a + coeff/a
    return np.power(1 - np.power(1-x, b), 1/b)


def time_string_seconds(time_str: str):
    return sum([
        a * b for a, b in zip([60, 1], map(float, time_str.split(':')))
    ])


def seconds_to_frames(secs: float):
    return int(secs * FRAME_RATE)