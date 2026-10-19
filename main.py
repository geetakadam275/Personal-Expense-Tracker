
from expenses import (
    add_expense,
    view_expenses,
    search_by_category,
    calculate_total,
    monthly_summary,
    delete_expense
)


def show_menu():
    print('\n' + '=' * 40)
    print('       PERSONAL EXPENSE TRACKER')
    print('=' * 40)
    print('1. Add Expense')
    print('2. View All Expenses')
    print('3. Search Expenses by Category')
    print('4. Calculate Total Expenses')
    print('5. Monthly Expense Summary')
    print('6. Delete Expense')
    print('7. Exit')
    print('=' * 40)


def main():
    while True:
        show_menu()

        choice = input('Enter your choice (1-7): ').strip()

        if choice == '1':
            add_expense()

        elif choice == '2':
            view_expenses()

        elif choice == '3':
            search_by_category()

        elif choice == '4':
            calculate_total()

        elif choice == '5':
            monthly_summary()

        elif choice == '6':
            delete_expense()

        elif choice == '7':
            print('Thank you for using Personal Expense Tracker!')
            break

        else:
            print('Invalid choice. Please enter a number from 1 to 7.')


if __name__ == '__main__':
    main()

