/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from '../__mocks__/store';
import { localStorageMock } from "../__mocks__/localStorage.js";

const bill = {
  id: "K459ek6eyBHGLeBPooPi",
  vat: "80",
  fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
  type: "Hôtel et logement",
  commentary: "séminaire billed",
  name: "Sample test",
  fileName: "preview-facture-free-201801-pdf-1.jpg",
  date: "2022-12-03",
  amount: 400,
  pct: 20
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    
    let onNavigate;

    beforeAll(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
    })

    beforeEach(() => {
      onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI();
    })

    afterEach(() => {
      onNavigate = null;
      document.body.innerHTML = '';
    })

    test("Then NewBill page title should be displayed properly", () => {
      expect(
        screen.getByTestId('newBillPageTitle')
      ).toHaveTextContent('Envoyer une note de frais');
    })
    
    test("Then NewBill form should be displayed properly", () => {
      expect(
        screen.getByTestId('form-new-bill')
      ).toBeTruthy();
    })

    test("Then, select options should be available", async () => {
      expect(
        screen.getByTestId('expense-type')
      ).toBeTruthy()
      
      expect(
        screen.getByTestId('expense-type')
      ).not.toBeEmptyDOMElement()
    })

    test("Then uploaded file with valid extension should be accepted", async () => {
      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      await waitFor(() => screen.getByTestId('file'));
      const inputFile = screen.getByTestId('file');

      inputFile.addEventListener('change', handleChangeFile);

      fireEvent.change(inputFile, {
        target: {
          files: [ new File(['test-file.jpg'], 'test-file.jpg', {type: 'image/jpeg'}) ]
        }
      });

      expect(handleChangeFile).toHaveBeenCalled();

      expect(inputFile.files[0].name).toBe('test-file.jpg');

      expect(
        screen.getByTestId('file-error-message')
      ).toHaveClass('hidden');
    })
    
    test("Then uploaded file with invalid extension shouldn't be accepted", async () => {
      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      await waitFor(() => screen.getByTestId('file'));
      const inputFile = screen.getByTestId('file');

      inputFile.addEventListener('change', handleChangeFile);

      fireEvent.change(inputFile, {
        target: {
          files: [ new File(['test-file.pdf'], 'test-file.pdf', {type: 'application/pdf'}) ]
        }
      });

      expect(handleChangeFile).toHaveBeenCalled();

      expect(inputFile.files[0].name).toBe('test-file.pdf');

      expect(
        screen.getByTestId('file-error-message')
      ).not.toHaveClass('hidden');
    })

    describe('When I try to add (POST) a new bill', () => {
      test("A new bill should be created", async () => {
        const _type = await screen.getByTestId('expense-type');
        const _name = await screen.getByTestId('expense-name');
        const _date = await screen.getByTestId('datepicker');
        const _amount = await screen.getByTestId('amount');
        const _pct = await screen.getByTestId('pct');
        const _vat = await screen.getByTestId('vat');
        const _commentary = await screen.getByTestId('commentary');
        const _file = await screen.getByTestId('file');
        const submitButton = await screen.getByTestId('submit-form');

        const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const handleSubmit = jest.fn(() => newBill.handleSubmit)
        submitButton.addEventListener('click', handleSubmit);

        _type.value = bill.type;
        _name.value = bill.name;
        _date.value = bill.date;
        _amount.value = bill.amount;
        _pct.value = bill.pct;
        _vat.value = bill.vat;
        _commentary.value = bill.commentary;
        fireEvent.change(_file, {
          target: {
            files: [ new File([bill.fileUrl], bill.fileName, {type: 'image/jpeg'}) ]
          }
        });

        fireEvent.click(submitButton);

        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      })
    })
  })
})
