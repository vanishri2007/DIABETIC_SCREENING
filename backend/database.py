import asyncio
from bson import ObjectId

class MockCursor:
    def __init__(self, data, query):
        self.data = data
        self.query = query

    async def __aiter__(self):
        for d in self.data:
            match = True
            for k, v in self.query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                yield d.copy()

class MockCollection:
    def __init__(self):
        self.data = []
        
    async def insert_one(self, doc):
        doc['_id'] = ObjectId()
        self.data.append(doc)
        class Result:
            inserted_id = doc['_id']
        return Result()

    async def find_one(self, query):
        for d in self.data:
            match = True
            for k, v in query.items():
                if hasattr(v, 'items') and k == '_id':
                    # Extremely basic fallback for $oid or ObjectId matching
                    if str(d.get(k)) != str(v): match = False; break
                elif str(d.get(k)) != str(v):
                    match = False
                    break
            if match:
                return d.copy()
        return None

    def find(self, query):
        return MockCursor(self.data, query)

    async def update_one(self, query, update):
        for d in self.data:
            match = True
            for k, v in query.items():
                if str(d.get(k)) != str(v):
                    match = False
                    break
            if match:
                if '$set' in update:
                    d.update(update['$set'])
                return

class MockDB:
    def __init__(self):
        self.users = MockCollection()
        self.patients = MockCollection()
        self.screenings = MockCollection()

# Export an exact drop-in structural replacement for motor's MongoDB db object
db = MockDB()
