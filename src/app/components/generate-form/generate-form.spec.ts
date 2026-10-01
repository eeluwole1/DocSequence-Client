import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllocationResponse } from '../../models/allocation';
import { GenerateForm } from './generate-form';

const allocateUrl = '/api/document-numbers';

describe('GenerateForm', () => {
  let fixture: ComponentFixture<GenerateForm>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateForm);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('/api/document-types').flush([{ documentTypeId: 1, prefix: 'CXY', name: 'CXY Drawing' }]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify()); // fails the test if an unexpected request was made

  it('fills the document type dropdown from the API', () => {
    const options = el.querySelectorAll('#documentTypeId option');
    expect(options.length).toBe(2); // placeholder + CXY
    expect(options[1].textContent).toContain('CXY');
  });

  it('shows validation messages and sends nothing when the form is empty', async () => {
    submit();
    await fixture.whenStable();

    http.expectNone(allocateUrl);
    expect(el.textContent).toContain('Enter your name');
    expect(el.textContent).toContain('Enter a document name');
    expect(el.textContent).toContain('Choose a document type');
  });

  it('disables Generate while the request is pending, then shows the identifier', async () => {
    fill('Ada', 'Pump drawing');
    submit();
    await fixture.whenStable();

    const request = http.expectOne(allocateUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ engineerName: 'Ada', documentName: 'Pump drawing', documentTypeId: 1 });
    expect(submitButton().disabled).toBe(true);

    request.flush(allocation('CXY-10431', request.request.body.requestKey));
    await fixture.whenStable();

    expect(el.textContent).toContain('CXY-10431');
    expect(submitButton().disabled).toBe(false);
  });

  it('reuses the request key when retrying after a failure, and uses a new one after success', async () => {
    fill('Ada', 'Pump drawing');
    submit();
    await fixture.whenStable();

    const first = http.expectOne(allocateUrl);
    const firstKey = first.request.body.requestKey;
    first.flush(
      { title: 'Service temporarily unavailable', detail: 'The database could not be reached.' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await fixture.whenStable();

    submit(); // unchanged form = same logical request (US-003)
    await fixture.whenStable();
    const retry = http.expectOne(allocateUrl);
    expect(retry.request.body.requestKey).toBe(firstKey);
    retry.flush(allocation('CXY-10431', firstKey));
    await fixture.whenStable();

    fill('Ada', 'Second drawing');
    submit();
    await fixture.whenStable();
    const next = http.expectOne(allocateUrl);
    expect(next.request.body.requestKey).not.toBe(firstKey);
    next.flush(allocation('CXY-10432', next.request.body.requestKey));
  });

  it('uses a new request key when the user edits the form after a failure', async () => {
    fill('Ada', 'Pump drawing');
    submit();
    await fixture.whenStable();

    const first = http.expectOne(allocateUrl);
    const firstKey = first.request.body.requestKey;
    first.flush(null, { status: 0, statusText: 'Unknown Error' });
    await fixture.whenStable();

    fill('Ada', 'Different drawing');
    submit();
    await fixture.whenStable();
    const second = http.expectOne(allocateUrl);
    expect(second.request.body.requestKey).not.toBe(firstKey);
    second.flush(allocation('CXY-10431', second.request.body.requestKey));
  });

  it('shows the API error and says generation was not confirmed', async () => {
    fill('Ada', 'Pump drawing');
    submit();
    await fixture.whenStable();

    http.expectOne(allocateUrl).flush(
      { title: 'Service temporarily unavailable', detail: 'The database could not be reached.' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await fixture.whenStable();

    expect(el.textContent).toContain('Generation was not confirmed');
    expect(el.textContent).toContain('The database could not be reached.');
  });

  // --- helpers: drive the form through the DOM, like a user would ---

  function fill(engineerName: string, documentName: string): void {
    setInput('#engineerName', engineerName);
    setInput('#documentName', documentName);
    const select = el.querySelector<HTMLSelectElement>('#documentTypeId')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
  }

  function setInput(selector: string, value: string): void {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  function submitButton(): HTMLButtonElement {
    return el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  function allocation(identifier: string, requestKey: string): AllocationResponse {
    return {
      allocationId: 1,
      documentTypeId: 1,
      prefix: 'CXY',
      number: Number(identifier.split('-')[1]),
      generatedIdentifier: identifier,
      documentName: 'Pump drawing',
      engineerName: 'Ada',
      requestKey,
      createdAt: '2026-10-01T12:00:00Z',
    };
  }
});