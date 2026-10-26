import csv
from datetime import datetime, date, timedelta
from pathlib import Path

class BusinessDayCalendar:
    """Official calendar calculator using holidays.csv as the single source of truth."""

    def __init__(self, holidays_csv_path: str | Path | None = None):
        self.holidays: set[date] = set()
        if holidays_csv_path:
            self.load_holidays(holidays_csv_path)

    def load_holidays(self, csv_path: str | Path):
        path = Path(csv_path)
        if not path.exists():
            return
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                d_str = row.get("date", "").strip()
                if d_str:
                    try:
                        dt = datetime.strptime(d_str, "%Y-%m-%d").date()
                        self.holidays.add(dt)
                    except ValueError:
                        pass

    def is_business_day(self, target_date: date | str) -> bool:
        dt = self._to_date(target_date)
        # 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun
        if dt.weekday() >= 5:
            return False
        return dt not in self.holidays

    def add_business_days(self, start_date: date | str, n_days: int) -> date:
        """Adds n business days to start_date (skipping weekends and holidays)."""
        dt = self._to_date(start_date)
        step = 1 if n_days >= 0 else -1
        remaining = abs(n_days)

        while remaining > 0:
            dt += timedelta(days=step)
            if self.is_business_day(dt):
                remaining -= 1

        return dt

    def add_calendar_days(self, start_date: date | str, n_days: int) -> date:
        """Adds n calendar days to start_date."""
        dt = self._to_date(start_date)
        return dt + timedelta(days=n_days)

    def business_days_between(self, start_date: date | str, end_date: date | str) -> int:
        """Counts business days strictly between start_date and end_date (exclusive of start)."""
        d1 = self._to_date(start_date)
        d2 = self._to_date(end_date)
        if d1 > d2:
            return -self.business_days_between(d2, d1)

        count = 0
        curr = d1 + timedelta(days=1)
        while curr <= d2:
            if self.is_business_day(curr):
                count += 1
            curr += timedelta(days=1)
        return count

    def calendar_days_between(self, start_date: date | str, end_date: date | str) -> int:
        d1 = self._to_date(start_date)
        d2 = self._to_date(end_date)
        return (d2 - d1).days

    @staticmethod
    def _to_date(val: date | str | datetime) -> date:
        if isinstance(val, date) and not isinstance(val, datetime):
            return val
        if isinstance(val, datetime):
            return val.date()
        if isinstance(val, str):
            # Try YYYY-MM-DD
            try:
                return datetime.strptime(val.strip(), "%Y-%m-%d").date()
            except ValueError:
                # Try common formats
                for fmt in ("%B %d, %Y", "%b %d, %Y", "%Y/%m/%d", "%d-%m-%Y"):
                    try:
                        return datetime.strptime(val.strip(), fmt).date()
                    except ValueError:
                        continue
        raise ValueError(f"Cannot parse date: {val}")
