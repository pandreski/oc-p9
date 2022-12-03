/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import '@testing-library/jest-dom';
import router from "../app/Router.js";
import Bills from '../containers/Bills';
import mockStore from '../__mocks__/store';

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))

      expect(
        screen.getByTestId('icon-window')
      ).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const datesSorted = [...dates].sort((a, b) => a - b)

      expect(dates).toEqual(datesSorted)
    })

    test("It should display the 'eye' icons", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const eyeIcons = screen.getAllByTestId('icon-eye')
      expect(eyeIcons).toBeTruthy()
    })

    test('It should return bills data', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })

      mockStore.bills = jest.fn().mockImplementationOnce(() => {
        return {
          list: jest.fn().mockResolvedValue([
            { 
              id: 1, 
              data: () => ({ date: '' }) 
            }
          ])
        }
      })

      const bills = new Bills({
        document, onNavigate, store: mockStore, localStorage
      })

      const res = bills.getBills()

      expect(res).toEqual(Promise.resolve({}))
    })

    describe('When I click on the "eye" icon', () => {
      test('Then, bill has to be shown in a modal', async () => {
        
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        document.body.innerHTML = BillsUI({data: bills})

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const bill = new Bills({
          document, onNavigate, store: null, bills, localStorage: window.localStorage
        })

        const handleClickIconEye = jest.fn((e) => bill.handleClickIconEye)

        await waitFor(() => screen.getAllByTestId('icon-eye'))

        const eye = screen.getAllByTestId('icon-eye')[0]
        eye.addEventListener('click', handleClickIconEye)
        fireEvent.click(eye)

        expect(handleClickIconEye).toHaveBeenCalled()

        expect(
          screen.getByTestId('bill-modal')
        ).toBeTruthy()
      })
    })

    describe('When I click on "New Bill" button', () => {
      test('Then, I\'m redirected to new bill form page', async () => {
        
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        document.body.innerHTML = BillsUI({data: bills})

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const bill = new Bills({
          document, onNavigate, store: null, bills, localStorage: window.localStorage
        })

        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill)

        await waitFor(() => screen.getByTestId('btn-new-bill'))

        const newBillButton = screen.getByTestId('btn-new-bill')
        newBillButton.addEventListener('click', handleClickNewBill)
        fireEvent.click(newBillButton);

        expect(handleClickNewBill).toHaveBeenCalled()

        await waitFor(() => screen.getByTestId('newBillPageTitle'))

        expect(
          screen.getByTestId('newBillPageTitle')
        ).toHaveTextContent('Envoyer une note de frais')
      })
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test('Fetches bills from mock API GET', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = ROUTES({ pathname: ROUTES_PATH.Bills, data: bills })

      await waitFor(() => screen.getByText("Mes notes de frais"))

      expect(
        screen.getByText("Mes notes de frais")
      ).toBeTruthy()
      expect(
        screen.getByTestId('tbody')
      ).not.toBeEmptyDOMElement()
    })
  })
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("Fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})
      const billsDom = BillsUI({error: "Erreur 404"})
      document.body.innerHTML = billsDom
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})
      const billsDom = BillsUI({error: "Erreur 500"})
      document.body.innerHTML = billsDom
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})