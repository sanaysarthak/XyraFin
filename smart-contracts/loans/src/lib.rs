#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, Map, Vec, BytesN, panic_with_error, IntoVal};

// Basic error codes for demo
#[derive(Clone, Copy)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    LoanNotFound = 2,
    InvalidState = 3,
    AmountTooLow = 4,
}

// Loan state
#[derive(Clone)]
pub struct Loan {
    pub borrower: Address,
    pub lender: Address,
    pub token: Address,    // Soroban token contract address
    pub principal: i128,
    pub interest_bps: u32, // basis points (e.g., 500 = 5%)
    pub approved: bool,
    pub repaid_amount: i128,
}

// Storage keys
fn loans_key() -> Symbol { Symbol::new("loans") }
fn counter_key() -> Symbol { Symbol::new("counter") }

fn read_loans(env: &Env) -> Map<i128, Loan> {
    match env.storage().instance().get::<_, Map<i128, Loan>>( &loans_key() ) {
        Some(m) => m,
        None => Map::<i128, Loan>::new(env),
    }
}
fn write_loans(env: &Env, m: &Map<i128, Loan>) {
    env.storage().instance().set(&loans_key(), m);
}
fn read_counter(env: &Env) -> i128 {
    env.storage().instance().get(&counter_key()).unwrap_or(0i128)
}
fn write_counter(env: &Env, c: i128) {
    env.storage().instance().set(&counter_key(), &c);
}

// Minimal token client (transfer)
mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name="TokenClient")]
    pub trait Token {
        fn transfer(e: Env, from: Address, to: Address, amount: i128);
    }
}

#[contract]
pub struct Loans;

#[contractimpl]
impl Loans {
    pub fn request_loan(env: Env, borrower: Address, token: Address, principal: i128, interest_bps: u32) -> i128 {
        if principal <= 0 { panic_with_error!(&env, Error::AmountTooLow); }
        borrower.require_auth();

        let mut loans = read_loans(&env);
        let id = read_counter(&env) + 1;
        let loan = Loan {
            borrower: borrower.clone(),
            lender: Address::Contract(BytesN::from_array(&env, &[0;32])), // placeholder until approved
            token,
            principal,
            interest_bps,
            approved: false,
            repaid_amount: 0,
        };
        loans.set(id, loan);
        write_loans(&env, &loans);
        write_counter(&env, id);
        id
    }

    pub fn approve_loan(env: Env, id: i128, lender: Address) {
        lender.require_auth();

        let mut loans = read_loans(&env);
        if !loans.contains_key(id) { panic_with_error!(&env, Error::LoanNotFound); }
        let mut loan = loans.get(id).unwrap();
        if loan.approved { panic_with_error!(&env, Error::InvalidState); }

        // Transfer principal from lender to borrower using token contract
        token::TokenClient::new(&env, &loan.token)
            .transfer(&lender, &loan.borrower, &loan.principal);

        loan.lender = lender;
        loan.approved = true;
        loans.set(id, loan);
        write_loans(&env, &loans);
    }

    pub fn repay_loan(env: Env, id: i128, from: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 { panic_with_error!(&env, Error::AmountTooLow); }

        let mut loans = read_loans(&env);
        if !loans.contains_key(id) { panic_with_error!(&env, Error::LoanNotFound); }
        let mut loan = loans.get(id).unwrap();
        if !loan.approved { panic_with_error!(&env, Error::InvalidState); }

        // Send repayment to lender
        token::TokenClient::new(&env, &loan.token)
            .transfer(&from, &loan.lender, &amount);

        loan.repaid_amount += amount;
        loans.set(id, loan);
        write_loans(&env, &loans);
    }

    pub fn get_loan(env: Env, id: i128) -> (Address, Address, Address, i128, u32, bool, i128) {
        let loans = read_loans(&env);
        if !loans.contains_key(id) { panic_with_error!(&env, Error::LoanNotFound); }
        let l = loans.get(id).unwrap();
        (l.borrower, l.lender, l.token, l.principal, l.interest_bps, l.approved, l.repaid_amount)
    }

    pub fn list_loans(env: Env) -> Vec<(i128, Address, Address, i128, bool)> {
        let loans = read_loans(&env);
        let mut out = Vec::new(&env);
        for (id, l) in loans.iter() {
            out.push_back((id, l.borrower, l.token, l.principal, l.approved));
        }
        out
    }
}
