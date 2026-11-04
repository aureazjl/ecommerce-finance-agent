import sqlite3
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from config import DB_PATH

ALLOWED_DIMENSIONS = {'department', 'manager', 'promotion_leader', 'product_name', 'stat_date'}
ALLOWED_METRICS = {'actual_sales', 'profit', 'operating_cost', 'goods_cost', 'total_cost'}
METRIC_SQL = {'actual_sales': 'actual_sales', 'profit': 'profit', 'operating_cost': 'operating_cost', 'goods_cost': 'goods_cost', 'total_cost': '(COALESCE(goods_cost,0)+COALESCE(operating_cost,0)+COALESCE(express_fee,0)+COALESCE(onsite_promotion_fee,0)+COALESCE(pugongying_fee,0)+COALESCE(qianfan_fee,0)+COALESCE(content_comment_fee,0)+COALESCE(dou_plus_fee,0)+COALESCE(props_competitor_fee,0)+COALESCE(qa_fee,0)+COALESCE(member_fee,0)+COALESCE(other_fee,0))'}

class QueryArgs(BaseModel):
    start_date: str = Field(pattern=r'^20\d{2}-\d{2}-\d{2}$')
    end_date: str = Field(pattern=r'^20\d{2}-\d{2}-\d{2}$')
    metric: Literal['actual_sales', 'profit', 'operating_cost', 'goods_cost', 'total_cost'] = 'profit'
    dimension: str | None = None
    limit: int = Field(default=10, ge=1, le=100)
    product_keyword: str | None = None
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
        where = 'stat_date>=? AND stat_date<=?'; params = [args.start_date, args.end_date]
        if args.product_keyword:
            where += ' AND product_name LIKE ?'; params.append(f'%{args.product_keyword}%')
        params.append(args.limit)
        return [dict(x) for x in db.execute(f'SELECT stat_date,department,manager,promotion_leader,product_name,actual_sales,operating_cost,goods_cost,express_fee,onsite_promotion_fee,pugongying_fee,qianfan_fee,content_comment_fee,dou_plus_fee,props_competitor_fee,qa_fee,member_fee,other_fee,profit FROM product_profit_daily WHERE {where} ORDER BY stat_date DESC,id LIMIT ?', params).fetchall()]

def aggregate(args: QueryArgs):
    if not args.dimension: return {'rows': query_rows(args), 'metric': args.metric, 'dimension': None}
    expression = METRIC_SQL[args.metric]
    where = 'stat_date>=? AND stat_date<=?'; params = ['未分类', args.start_date, args.end_date]
    if args.product_keyword:
        where += ' AND product_name LIKE ?'; params.append(f'%{args.product_keyword}%')
    params.append(args.limit)
    sql = f'SELECT COALESCE({args.dimension}, ?) AS name, SUM({expression}) AS value, COUNT(*) AS rows FROM product_profit_daily WHERE {where} GROUP BY {args.dimension} ORDER BY value DESC LIMIT ?'
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = [dict(x) for x in db.execute(sql, params).fetchall()]
    return {'rows': rows, 'metric': args.metric, 'dimension': args.dimension}

def compare(args: QueryArgs, previous_start: str, previous_end: str):
    current = aggregate(args); previous = aggregate(args.model_copy(update={'start_date': previous_start, 'end_date': previous_end})); return {'current': current, 'previous': previous}
