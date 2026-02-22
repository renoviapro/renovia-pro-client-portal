import time

_store: dict[str, list[float]] = {}
_windows: dict[str, int] = {}

def is_allowed(key: str, window_sec: int, max_per_window: int) -> bool:
    now = time.time()
    if key not in _store:
        _store[key] = []
        _windows[key] = window_sec
    times = _store[key]
    times[:] = [t for t in times if now - t < _windows[key]]
    if len(times) >= max_per_window:
        return False
    times.append(now)
    return True
