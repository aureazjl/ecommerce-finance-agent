import sqlite3
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from config import DB_PATH

ALLOWED_DIMENSIONS = {'department', 'manager', 'promotion_leader', 'product_name', 'stat_date'}
ALLOWED_METRICS = {'actual_sales', 'profit', 'operating_cost', 'goods_cost'}

class QueryArgs(BaseModel):
    start_date: str = Field(pattern=r'^20\d{2}-\d{2}-\d{2}$')
    end_date: str = Field(pattern=r'^20\d{2}-\d{2}-\d{2}$')
    metric: Literal['actual_sales', 'profit', 'operating_cost', 'goods_cost'] = 'profit'
    dimension: str | None = None
    limit: int = Field(default=10, ge=1, le=100)
    @field_validator('dimension')
    @classmethod
    def valid_dimension(cls, value):
        if value is not None and value not in ALLOWED_DIMENSIONS: raise ValueError('不允许的分析维度')
        return value
    @model_validator(mode='after')
    def valid_range(self):
        if self.start_date > self.end_date: raise ValueError('开始日期不能晚于结束日期')
        return self

def query_rows(args: QueryArgs):
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        return [dict(x) for x in db.execute('SELECT stat_date,department,manager,promotion_leader,product_name,actual_sales,operating_cost,goods_cost,profit FROM product_profit_daily WHERE stat_date>=? AND stat_date<=? ORDER BY stat_date DESC,id LIMIT ?', (args.start_date, args.end_date, args.limit)).fetchall()]

def aggregate(args: QueryArgs):
    if not args.dimension: return {'rows': query_rows(args), 'metric': args.metric, 'dimension': None}
    sql = f'SELECT COALESCE({args.dimension}, ?) AS name, SUM({args.metric}) AS value, COUNT(*) AS rows FROM product_profit_daily WHERE stat_date>=? AND stat_date<=? GROUP BY {args.dimension} ORDER BY value DESC LIMIT ?'
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = [dict(x) for x in db.execute(sql, ('未分类', args.start_date, args.end_date, args.limit)).fetchall()]
    return {'rows': rows, 'metric': args.metric, 'dimension': args.dimension}

def compare(args: QueryArgs, previous_start: str, previous_end: str):
    current = aggregate(args); previous = aggregate(args.model_copy(update={'start_date': previous_start, 'end_date': previous_end})); return {'current': current, 'previous': previous}
