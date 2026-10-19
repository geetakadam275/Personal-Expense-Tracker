
import json
import os
from datetime import datetime

DATA_FILE = 'expenses.json'

CATEGORIES = [
    'Food',
    'Travel',
    'Shopping',
    'Education',
    'Bills',
    'Health',
    'Entertainment',
    'Other'
]


def load_expenses():
    if not os.path.exists(DATA_FILE):
        return []

    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as file:
            data = json.load(file)

            if isinstance(data, list):
                return data

            print('Error: Expense data must be a list.')
            return []

    except (json.JSONDecodeError, OSError):
        print('Could not read expense data.')
        return []


def save_expenses(expenses):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as file:
            json.dump(expenses, file, indent=4)

        return True

    except OSError:
        print('Error: Could not save expenses.')
        return False


def get_date():
    while True:
        expense_date = input(
            'Enter date (YYYY-MM-DD), or press Enter for today: '
        ).strip()

        if expense_date == '':
            return datetime.today().strftime('%Y-%m-%d')

        try:
            datetime.strptime(expense_date, '%Y-%m-%d')
            return expense_date

        except ValueError:
            print('Invalid date. Example: 2026-10-19')


def add_expense():
    print('\n--- Add New Expense ---')

    title = input('Enter expense title: ').strip()

    if not title:
        print('Expense title cannot be empty.')
        return

    while True:
        try:
            amount = float(input('Enter amount (₹): '))

            if amount <= 0:
                print('Amount must be greater than zero.')
                continue

            break

        except ValueError:
            print('Please enter a valid amount.')

    print('\nAvailable Categories:')
    for index, category in enumerate(CATEGORIES, start=1):
        print(f'{index}. {category}')

    while True:
        choice = input('Choose category number: ').strip()

        try:
            category_index = int(choice) - 1

            if 0 <= category_index < len(CATEGORIES):
                category = CATEGORIES[category_index]
                break

            print('Please select a valid category number.')

        except ValueError:
            print('Please enter a number.')

    expense_date = get_date()

    expenses = load_expenses()

    expense = {
        'id': max(
            (item.get('id', 0) for item in expenses),
            default=0
        ) + 1,
        'title': title,
        'amount': round(amount, 2),
        'category': category,
        'date': expense_date
    }

    expenses.append(expense)

    if save_expenses(expenses):
        print('\nExpense added successfully!')
        print(f'Title: {title}')
        print(f'Amount: ₹{amount:.2f}')
        print(f'Category: {category}')
        print(f'Date: {expense_date}')


def view_expenses():
    print('\n--- All Expenses ---')

    expenses = load_expenses()

    if not expenses:
        print('No expenses found.')
        return

    print('-' * 75)
    print(
        f"{'ID':<5}{'Title':<20}{'Amount (₹)':<15}"
        f"{'Category':<18}{'Date':<12}"
    )
    print('-' * 75)

    for expense in expenses:
        print(
            f"{expense.get('id', '-'):<5}"
            f"{expense.get('title', '')[:19]:<20}"
            f"{expense.get('amount', 0):<15.2f}"
            f"{expense.get('category', ''):<18}"
            f"{expense.get('date', ''):<12}"
        )

    print('-' * 75)


def search_by_category():
    print('\n--- Search Expenses by Category ---')

    category = input('Enter category to search: ').strip().lower()

    if not category:
        print('Category cannot be empty.')
        return

    expenses = load_expenses()

    results = [
        expense for expense in expenses
        if expense.get('category', '').lower() == category
    ]

    if not results:
        print('No expenses found in this category.')
        print('Available categories:', ', '.join(CATEGORIES))
        return

    total = 0

    for expense in results:
        print(
            f"ID: {expense.get('id')} | "
            f"Title: {expense.get('title')} | "
            f"Amount: ₹{expense.get('amount', 0):.2f} | "
            f"Date: {expense.get('date')}"
        )
        total += expense.get('amount', 0)

    print(f'Total for {category.title()}: ₹{total:.2f}')


def calculate_total():
    print('\n--- Total Expenses ---')

    expenses = load_expenses()

    total = sum(
        expense.get('amount', 0)
        for expense in expenses
    )

    print(f'Total expenses: ₹{total:.2f}')
    print(f'Number of expenses: {len(expenses)}')


def monthly_summary():
    print('\n--- Monthly Expense Summary ---')

    current_month = datetime.today().strftime('%Y-%m')

    month = input(
        f'Enter month (YYYY-MM), or press Enter for {current_month}: '
    ).strip()

    if month == '':
        month = current_month

    try:
        datetime.strptime(month, '%Y-%m')

    except ValueError:
        print('Invalid month. Example: 2026-10')
        return

    expenses = load_expenses()

    monthly_expenses = [
        expense for expense in expenses
        if expense.get('date', '').startswith(month)
    ]

    if not monthly_expenses:
        print(f'No expenses found for {month}.')
        return

    category_totals = {}

    for expense in monthly_expenses:
        category = expense.get('category', 'Other')
        amount = expense.get('amount', 0)

        category_totals[category] = (
            category_totals.get(category, 0) + amount
        )

    total = sum(category_totals.values())

    print(f'\nSummary for {month}')
    print('-' * 35)

    for category, amount in category_totals.items():
        print(f'{category}: ₹{amount:.2f}')

    print('-' * 35)
    print(f'Total monthly expenses: ₹{total:.2f}')


def delete_expense():
    print('\n--- Delete Expense ---')

    expenses = load_expenses()

    if not expenses:
        print('No expenses available to delete.')
        return

    view_expenses()

    try:
        expense_id = int(input('\nEnter the expense ID to delete: '))

    except ValueError:
        print('Please enter a valid ID number.')
        return

    for expense in expenses:
        if expense.get('id') == expense_id:
            confirm = input(
                f"Delete '{expense.get('title')}'? (yes/no): "
            ).strip().lower()

            if confirm == 'yes':
                expenses.remove(expense)

                if save_expenses(expenses):
                    print('Expense deleted successfully.')

            else:
                print('Deletion cancelled.')

            return

    print('Expense ID not found.')
