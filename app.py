import csv
import io
import os
from datetime import datetime
from flask import Flask, jsonify, render_template, request, Response

from expenses import CATEGORIES, load_expenses, save_expenses

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html', categories=CATEGORIES)


@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Personal Expense Tracker Web Service',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify({'categories': CATEGORIES})


@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    expenses = load_expenses()

    # Query parameters
    category_filter = request.args.get('category', '').strip()
    search_query = request.args.get('search', '').strip().lower()
    month_filter = request.args.get('month', '').strip()
    sort_by = request.args.get('sort', 'date_desc').strip()

    filtered = expenses

    if category_filter and category_filter.lower() != 'all':
        filtered = [
            item for item in filtered
            if item.get('category', '').lower() == category_filter.lower()
        ]

    if search_query:
        filtered = [
            item for item in filtered
            if search_query in item.get('title', '').lower()
        ]

    if month_filter:
        filtered = [
            item for item in filtered
            if str(item.get('date', '')).startswith(month_filter)
        ]

    # Sorting
    if sort_by == 'date_asc':
        filtered.sort(key=lambda x: str(x.get('date', '')))
    elif sort_by == 'date_desc':
        filtered.sort(key=lambda x: str(x.get('date', '')), reverse=True)
    elif sort_by == 'amount_asc':
        filtered.sort(key=lambda x: float(x.get('amount', 0)))
    elif sort_by == 'amount_desc':
        filtered.sort(key=lambda x: float(x.get('amount', 0)), reverse=True)
    elif sort_by == 'title_asc':
        filtered.sort(key=lambda x: str(x.get('title', '')).lower())
    else:
        # Default newest first
        filtered.sort(key=lambda x: (str(x.get('date', '')), x.get('id', 0)), reverse=True)

    # Compute overall statistics (based on all loaded expenses)
    total_amount = sum(float(item.get('amount', 0)) for item in expenses)
    current_month = datetime.today().strftime('%Y-%m')
    current_month_total = sum(
        float(item.get('amount', 0))
        for item in expenses
        if str(item.get('date', '')).startswith(current_month)
    )

    category_counts = {}
    for item in expenses:
        cat = item.get('category', 'Other')
        category_counts[cat] = category_counts.get(cat, 0) + float(item.get('amount', 0))

    top_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else 'None'

    filtered_total = sum(float(item.get('amount', 0)) for item in filtered)

    return jsonify({
        'expenses': filtered,
        'filteredCount': len(filtered),
        'filteredTotal': round(filtered_total, 2),
        'stats': {
            'totalExpenses': round(total_amount, 2),
            'totalCount': len(expenses),
            'currentMonth': current_month,
            'currentMonthTotal': round(current_month_total, 2),
            'topCategory': top_category,
            'avgExpense': round(total_amount / len(expenses), 2) if expenses else 0.0
        }
    })


@app.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.get_json(silent=True) or request.form.to_dict()

    title = str(data.get('title', '')).strip()
    if not title:
        return jsonify({'error': 'Expense title is required.'}), 400

    raw_amount = data.get('amount')
    try:
        amount = float(raw_amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than zero.'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'A valid positive amount is required.'}), 400

    category = str(data.get('category', '')).strip()
    if category not in CATEGORIES:
        category = 'Other'

    expense_date = str(data.get('date', '')).strip()
    if not expense_date:
        expense_date = datetime.today().strftime('%Y-%m-%d')
    else:
        try:
            datetime.strptime(expense_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Expected YYYY-MM-DD.'}), 400

    expenses = load_expenses()
    new_id = max((item.get('id', 0) for item in expenses), default=0) + 1

    new_expense = {
        'id': new_id,
        'title': title,
        'amount': round(amount, 2),
        'category': category,
        'date': expense_date
    }

    expenses.append(new_expense)

    if not save_expenses(expenses):
        return jsonify({'error': 'Could not save expense data to storage.'}), 500

    return jsonify({
        'message': 'Expense created successfully.',
        'expense': new_expense
    }), 201


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def remove_expense(expense_id):
    expenses = load_expenses()
    target = next((item for item in expenses if item.get('id') == expense_id), None)

    if not target:
        return jsonify({'error': f'Expense with ID {expense_id} not found.'}), 404

    expenses.remove(target)

    if not save_expenses(expenses):
        return jsonify({'error': 'Could not update data storage.'}), 500

    return jsonify({
        'message': f"Expense '{target.get('title')}' deleted successfully.",
        'deletedId': expense_id
    })


@app.route('/api/summary', methods=['GET'])
def get_summary():
    expenses = load_expenses()

    # Category breakdown
    category_totals = {cat: 0.0 for cat in CATEGORIES}
    category_counts = {cat: 0 for cat in CATEGORIES}

    # Monthly breakdown
    monthly_totals = {}

    for item in expenses:
        cat = item.get('category', 'Other')
        amount = float(item.get('amount', 0))
        date_str = str(item.get('date', ''))

        if cat not in category_totals:
            category_totals[cat] = 0.0
            category_counts[cat] = 0

        category_totals[cat] += amount
        category_counts[cat] += 1

        month_key = date_str[:7] if len(date_str) >= 7 else 'Unknown'
        monthly_totals[month_key] = monthly_totals.get(month_key, 0.0) + amount

    sorted_months = sorted([m for m in monthly_totals.keys() if m != 'Unknown'])
    if 'Unknown' in monthly_totals:
        sorted_months.append('Unknown')

    monthly_list = [
        {'month': m, 'total': round(monthly_totals[m], 2)}
        for m in sorted_months
    ]

    category_list = [
        {
            'category': cat,
            'total': round(category_totals[cat], 2),
            'count': category_counts[cat]
        }
        for cat in CATEGORIES
        if category_totals[cat] > 0
    ]
    category_list.sort(key=lambda x: x['total'], reverse=True)

    return jsonify({
        'grandTotal': round(sum(category_totals.values()), 2),
        'categoryBreakdown': category_list,
        'monthlyTrend': monthly_list
    })


@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    expenses = load_expenses()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Title', 'Amount', 'Category', 'Date'])

    for exp in expenses:
        writer.writerow([
            exp.get('id', ''),
            exp.get('title', ''),
            exp.get('amount', 0),
            exp.get('category', ''),
            exp.get('date', '')
        ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=expenses_export.csv'}
    )


@app.route('/api/seed-samples', methods=['POST'])
def seed_samples():
    """Adds realistic sample expenses so the user can immediately test visual charts and summaries."""
    expenses = load_expenses()
    if expenses:
        return jsonify({'message': 'Existing expenses found. Seeding skipped.', 'count': len(expenses)})

    today = datetime.today().strftime('%Y-%m-%d')
    sample_data = [
        {'id': 1, 'title': 'Grocery Shopping', 'amount': 1850.50, 'category': 'Food', 'date': today},
        {'id': 2, 'title': 'Metro Travel Pass', 'amount': 650.00, 'category': 'Travel', 'date': today},
        {'id': 3, 'title': 'Electricity Bill', 'amount': 1240.00, 'category': 'Bills', 'date': today},
        {'id': 4, 'title': 'Online Course Subscription', 'amount': 999.00, 'category': 'Education', 'date': today},
        {'id': 5, 'title': 'Weekend Movie & Dinner', 'amount': 1450.00, 'category': 'Entertainment', 'date': today},
        {'id': 6, 'title': 'Health Checkup & Vitamins', 'amount': 820.00, 'category': 'Health', 'date': today},
        {'id': 7, 'title': 'Running Shoes', 'amount': 2499.00, 'category': 'Shopping', 'date': today},
    ]

    save_expenses(sample_data)
    return jsonify({'message': 'Sample data loaded successfully.', 'count': len(sample_data)})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f'Starting Personal Expense Tracker Web Server on http://0.0.0.0:{port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
